// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title WorklineFXPool
/// @notice Minimal Uniswap V2-style constant-product pair (xyk) for
///         USDC ↔ wMXN. LP shares are minted as this contract's own
///         ERC-20 balance ("Workline FX LP" / WFX-LP). Liquidity removal
///         is intentionally NOT implemented in v1 — the demo only exercises
///         add-liquidity and swap.
/// @dev    Designed for hackathon-grade clarity. Charges a 30 bps fee on
///         swaps which accrues to the pool reserves and is captured by LPs
///         on subsequent adds.
contract WorklineFXPool is ERC20 {
    using SafeERC20 for IERC20;

    uint16 public constant FEE_BPS = 30;        // 0.30%
    uint16 public constant BPS_DENOM = 10_000;
    uint256 public constant MIN_LIQUIDITY = 1_000;

    address public immutable token0;            // USDC (6 dp)
    address public immutable token1;            // wMXN (6 dp)

    uint128 public reserve0;
    uint128 public reserve1;

    event LiquidityAdded(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 shares
    );
    event Swap(
        address indexed sender,
        address indexed recipient,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _token0, address _token1) ERC20("Workline FX LP", "WFX-LP") {
        require(_token0 != address(0) && _token1 != address(0), "zero token");
        require(_token0 != _token1, "same token");
        token0 = _token0;
        token1 = _token1;
    }

    /// @notice Returns the current pool reserves.
    function getReserves() external view returns (uint128, uint128) {
        return (reserve0, reserve1);
    }

    /// @notice Quote `amountOut` for a given input — pure helper for the UI.
    function quote(uint256 amountIn, address tokenIn) external view returns (uint256) {
        require(tokenIn == token0 || tokenIn == token1, "bad token");
        bool zeroForOne = tokenIn == token0;
        (uint256 reserveIn, uint256 reserveOut) = zeroForOne
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));
        if (reserveIn == 0 || reserveOut == 0 || amountIn == 0) return 0;
        uint256 amountInAfterFee = amountIn * (BPS_DENOM - FEE_BPS);
        uint256 numerator = amountInAfterFee * reserveOut;
        uint256 denominator = reserveIn * BPS_DENOM + amountInAfterFee;
        return numerator / denominator;
    }

    /// @notice Provide liquidity in both tokens. The caller MUST have
    ///         approved the pool for both tokens. Mints LP shares into
    ///         the caller. The first depositor sets the price; later
    ///         depositors must respect the existing ratio (excess input
    ///         is NOT refunded, callers should pre-balance off-chain).
    function addLiquidity(
        uint256 amount0,
        uint256 amount1,
        address to,
        uint256 minShares
    ) external returns (uint256 shares) {
        require(amount0 > 0 && amount1 > 0, "zero amount");
        require(to != address(0), "zero to");

        uint256 supply = totalSupply();
        if (supply == 0) {
            shares = Math.sqrt(amount0 * amount1);
            require(shares > MIN_LIQUIDITY, "min liquidity");
            // Burn a tiny amount to address(0) to lock minimum liquidity
            // forever — this prevents share price manipulation by the
            // first depositor draining everything to a single wei.
            _mint(address(0xdEaD), MIN_LIQUIDITY);
            shares -= MIN_LIQUIDITY;
        } else {
            uint256 sharesFrom0 = (amount0 * supply) / reserve0;
            uint256 sharesFrom1 = (amount1 * supply) / reserve1;
            shares = sharesFrom0 < sharesFrom1 ? sharesFrom0 : sharesFrom1;
        }

        require(shares >= minShares, "slippage");
        require(shares > 0, "zero shares");

        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        reserve0 += uint128(amount0);
        reserve1 += uint128(amount1);

        _mint(to, shares);
        emit LiquidityAdded(to, amount0, amount1, shares);
    }

    /// @notice Swap exact `amountIn` of `tokenIn` for the other token.
    /// @param amountIn  Input amount (in token decimals).
    /// @param tokenIn   Either `token0` or `token1`.
    /// @param to        Recipient of the output token.
    /// @param minOut    Slippage guard.
    function swap(
        uint256 amountIn,
        address tokenIn,
        address to,
        uint256 minOut
    ) external returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "bad token");
        require(amountIn > 0, "zero in");
        require(to != address(0), "zero to");

        bool zeroForOne = tokenIn == token0;
        (uint256 reserveIn, uint256 reserveOut) = zeroForOne
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");

        uint256 amountInAfterFee = amountIn * (BPS_DENOM - FEE_BPS);
        uint256 numerator = amountInAfterFee * reserveOut;
        uint256 denominator = reserveIn * BPS_DENOM + amountInAfterFee;
        amountOut = numerator / denominator;
        require(amountOut >= minOut, "slippage");
        require(amountOut > 0, "zero out");

        address tokenOut = zeroForOne ? token1 : token0;

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(to, amountOut);

        if (zeroForOne) {
            reserve0 += uint128(amountIn);
            reserve1 -= uint128(amountOut);
        } else {
            reserve1 += uint128(amountIn);
            reserve0 -= uint128(amountOut);
        }

        emit Swap(msg.sender, to, tokenIn, amountIn, amountOut);
    }
}
