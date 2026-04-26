// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {WorklineFXPool} from "../src/WorklineFXPool.sol";

contract WorklineFXTest is Test {
    MockERC20 internal usdc;
    MockERC20 internal wmxn;
    WorklineFXPool internal pool;

    address internal deployer = address(0xA11CE);
    address internal alice = address(0xB0B);

    uint256 internal constant ONE = 1e6;

    function setUp() public {
        vm.startPrank(deployer);
        usdc = new MockERC20("USD Coin", "USDC", 6, 1_000 * ONE, deployer);
        wmxn = new MockERC20("Wrapped MXN", "wMXN", 6, 18_000 * ONE, deployer);
        pool = new WorklineFXPool(address(usdc), address(wmxn));

        usdc.mint(deployer, 1_000_000 * ONE);
        wmxn.mint(deployer, 18_000_000 * ONE);

        usdc.approve(address(pool), type(uint256).max);
        wmxn.approve(address(pool), type(uint256).max);
        pool.addLiquidity(100_000 * ONE, 1_800_000 * ONE, deployer, 0);
        vm.stopPrank();
    }

    function test_initial_reserves() public view {
        (uint128 r0, uint128 r1) = pool.getReserves();
        assertEq(r0, 100_000 * ONE);
        assertEq(r1, 1_800_000 * ONE);
        assertGt(pool.totalSupply(), 0);
    }

    function test_quote_matches_swap_output() public {
        uint256 amountIn = 100 * ONE;
        uint256 quoted = pool.quote(amountIn, address(usdc));
        assertGt(quoted, 0);

        // Mint Alice some USDC and let her swap.
        vm.prank(deployer);
        usdc.mint(alice, amountIn);

        vm.startPrank(alice);
        usdc.approve(address(pool), amountIn);
        uint256 received = pool.swap(amountIn, address(usdc), alice, 0);
        vm.stopPrank();

        assertEq(received, quoted);
        assertEq(wmxn.balanceOf(alice), quoted);
    }

    function test_faucet_drops_amount_then_cooldown() public {
        usdc.faucet(alice);
        assertEq(usdc.balanceOf(alice), 1_000 * ONE);

        vm.expectRevert(bytes("faucet cooldown"));
        usdc.faucet(alice);

        vm.warp(block.timestamp + 6 hours + 1);
        usdc.faucet(alice);
        assertEq(usdc.balanceOf(alice), 2_000 * ONE);
    }

    function test_addLiquidity_subsequent_uses_ratio() public {
        uint256 add0 = 10_000 * ONE;
        uint256 add1 = 180_000 * ONE;

        vm.prank(deployer);
        usdc.mint(alice, add0);
        vm.prank(deployer);
        wmxn.mint(alice, add1);

        vm.startPrank(alice);
        usdc.approve(address(pool), add0);
        wmxn.approve(address(pool), add1);
        uint256 shares = pool.addLiquidity(add0, add1, alice, 0);
        vm.stopPrank();

        assertGt(shares, 0);
        assertEq(pool.balanceOf(alice), shares);
    }

    function test_swap_reverts_on_slippage() public {
        uint256 amountIn = 100 * ONE;
        vm.prank(deployer);
        usdc.mint(alice, amountIn);

        vm.startPrank(alice);
        usdc.approve(address(pool), amountIn);
        vm.expectRevert(bytes("slippage"));
        pool.swap(amountIn, address(usdc), alice, type(uint256).max);
        vm.stopPrank();
    }
}
