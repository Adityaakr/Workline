// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockERC20
/// @notice Demo-grade ERC-20 with a configurable decimals value and an
///         owner-gated `mint` plus a permissioned faucet (`mintTo`) used by
///         the Workline FX backend to drop demo balances on first use. This
///         contract is intentionally simple — it is for showcase purposes
///         only and is NOT meant to represent the real USDC/MXN economic
///         system. The supply is uncapped and minting is centralized.
contract MockERC20 is ERC20, Ownable {
    uint8 private immutable _decimals;

    /// @notice Per-address faucet cooldown (seconds) to prevent spam.
    uint256 public constant FAUCET_COOLDOWN = 6 hours;

    /// @notice Max amount that can be dispensed per faucet call.
    uint256 public immutable faucetAmount;

    /// @notice Last time a given address received from the faucet.
    mapping(address => uint256) public lastFaucetAt;

    event FaucetDripped(address indexed to, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 faucetAmount_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        _decimals = decimals_;
        faucetAmount = faucetAmount_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Owner-gated mint (used by deploy script + admin tooling).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Cooldown-gated faucet, callable by anyone — designed to be
    ///         relayed by the Workline FX `/api/faucet` route on first
    ///         user visit so the demo wallet always has a balance to swap.
    function faucet(address to) external returns (uint256) {
        require(to != address(0), "zero addr");
        uint256 last = lastFaucetAt[to];
        if (last != 0) {
            require(block.timestamp >= last + FAUCET_COOLDOWN, "faucet cooldown");
        }
        lastFaucetAt[to] = block.timestamp;
        _mint(to, faucetAmount);
        emit FaucetDripped(to, faucetAmount);
        return faucetAmount;
    }
}
