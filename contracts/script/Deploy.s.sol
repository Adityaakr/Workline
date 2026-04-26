// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {WorklineFXPool} from "../src/WorklineFXPool.sol";

/// @notice Deploys the Workline FX showcase stack: USDC mock, wMXN mock,
///         and the FX pool. Mints initial deployer supplies and seeds the
///         pool with 100k USDC / 1.8M wMXN at a 1:18 peg (USDC → wMXN).
contract Deploy is Script {
    // 6 decimals to match real USDC convention.
    uint8 internal constant DECIMALS = 6;
    uint256 internal constant ONE = 10 ** uint256(DECIMALS);

    // Faucet drop sizes per /api/faucet call. Symmetric since the
    // pool is seeded 1:1 in this demo build.
    uint256 internal constant USDC_FAUCET = 1_000 * ONE;       // 1,000 USDC
    uint256 internal constant WMXN_FAUCET = 1_000 * ONE;       // 1,000 wMXN

    // Initial deployer mints. We mint enough to seed the pool AND keep
    // a treasury that can sponsor ~100 faucet drops for demo users.
    uint256 internal constant USDC_INITIAL = 200_000 * ONE;    // 200k USDC
    uint256 internal constant WMXN_INITIAL = 200_000 * ONE;    // 200k wMXN

    // Pool seed amounts (1:1 demo ratio — clean optics for showcase).
    uint256 internal constant SEED_USDC = 100_000 * ONE;       // 100k
    uint256 internal constant SEED_WMXN = 100_000 * ONE;       // 100k

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(pk);

        MockERC20 usdc = new MockERC20(
            "USD Coin (Workline Demo)",
            "USDC",
            DECIMALS,
            USDC_FAUCET,
            deployer
        );
        console2.log("USDC deployed:", address(usdc));

        MockERC20 wmxn = new MockERC20(
            "Wrapped Mexican Peso (Workline Demo)",
            "wMXN",
            DECIMALS,
            WMXN_FAUCET,
            deployer
        );
        console2.log("wMXN deployed:", address(wmxn));

        WorklineFXPool pool = new WorklineFXPool(address(usdc), address(wmxn));
        console2.log("Pool deployed:", address(pool));

        usdc.mint(deployer, USDC_INITIAL);
        wmxn.mint(deployer, WMXN_INITIAL);

        usdc.approve(address(pool), SEED_USDC);
        wmxn.approve(address(pool), SEED_WMXN);

        uint256 shares = pool.addLiquidity(SEED_USDC, SEED_WMXN, deployer, 0);
        console2.log("Seed LP shares minted:", shares);

        vm.stopBroadcast();

        console2.log("================ DEPLOY SUMMARY ================");
        console2.log("USDC: ", address(usdc));
        console2.log("wMXN: ", address(wmxn));
        console2.log("Pool: ", address(pool));
        console2.log("================================================");
    }
}
