use zkube::models::game::AssertTrait;
// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{set_contract_address, set_caller_address, set_block_timestamp};
use starknet::get_block_timestamp;

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::mint::{Mint, MintTrait, MintAssert};
use zkube::systems::minter::IMinterDispatcherTrait;

use zkube::tests::mocks::erc721::{
    IERC721Dispatcher, IERC721DispatcherTrait, ERC721, IERC721MintableDispatcher,
    IERC721MintableDispatcherTrait
};
use zkube::tests::mocks::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use zkube::tests::setup::{
    setup,
    setup::{Systems, ADMIN, PLAYER1, mint_token_for_user, get_user_tokens, get_user_token_by_index}
};

#[test]
fn test_erc721_user_mint_for_himself() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    let erc721_mintable = IERC721MintableDispatcher {
        contract_address: context.erc721.contract_address
    };
    let erc721 = IERC721Dispatcher { contract_address: context.erc721.contract_address };
    let erc20 = IERC20Dispatcher { contract_address: context.erc20.contract_address };

    let is_paused = erc721_mintable.get_is_paused();
    assert(!is_paused, 'Contract should not be paused');

    set_block_timestamp(1000);

    // Check initial ERC20 balance
    let initial_erc20_balance = erc20.balance_of(PLAYER1().into());
    let price = erc721_mintable.get_mint_price();
    assert(initial_erc20_balance >= price, 'Insufficient ERC20 balance');

    // Ensure we're using the correct caller for approval
    set_contract_address(PLAYER1());

    // Check allowance before approval
    let initial_allowance = erc20.allowance(PLAYER1().into(), erc721.contract_address);
    assert_eq!(initial_allowance, 0, "Initial allowance should be 0");

    // Approve ERC721 contract to spend ERC20
    erc20.approve(erc721.contract_address, price);

    // Verify approval was successful
    let new_allowance = erc20.allowance(PLAYER1().into(), erc721.contract_address);
    assert_eq!(new_allowance, price, "Approval failed");

    // Now attempt the mint
    erc721_mintable.public_mint(PLAYER1().into());

    // Verify mint was successful
    let final_nft_balance = erc721.balance_of(PLAYER1().into());
    assert_eq!(final_nft_balance, 1, "Minting failed");

    // Verify ERC20 tokens were spent
    let final_erc20_balance = erc20.balance_of(PLAYER1().into());
    assert_eq!(final_erc20_balance, initial_erc20_balance - price, "ERC20 tokens weren't deducted");

    // Verify allowance was consumed
    let final_allowance = erc20.allowance(PLAYER1().into(), erc721.contract_address);
    assert_eq!(final_allowance, 0, "Allowance wasn't consumed");
}

#[test]
fn test_erc721_2() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    // Mint token for PLAYER1
    let token_id = mint_token_for_user(
        context.erc721.contract_address, context.erc20.contract_address, PLAYER1().into()
    );
    assert(token_id == 1, 'Minting should succeed');

    // Mint token for PLAYER1
    let token_id = mint_token_for_user(
        context.erc721.contract_address, context.erc20.contract_address, PLAYER1().into()
    );
    assert(token_id == 2, 'Minting should succeed');

    let tokens: Array<u256> = get_user_tokens(context.erc721.contract_address, PLAYER1().into());
    assert(tokens.len() == 2, 'Player should have 2 tokens');

    let token_id_1 = get_user_token_by_index(context.erc721.contract_address, PLAYER1().into(), 0);
    assert_eq!(token_id_1, 1);
    let token_id_2 = get_user_token_by_index(context.erc721.contract_address, PLAYER1().into(), 1);
    assert_eq!(token_id_2, 2);
}

#[test]
fn test_erc721_minter_mint_for_user() {
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    let erc721_mintable = IERC721MintableDispatcher {
        contract_address: context.erc721.contract_address
    };
    let erc721 = IERC721Dispatcher { contract_address: context.erc721.contract_address };
    let erc20 = IERC20Dispatcher { contract_address: context.erc20.contract_address };

    let is_paused = erc721_mintable.get_is_paused();
    assert(!is_paused, 'Contract should not be paused');

    set_block_timestamp(1000);

    // Ensure we're using the correct caller for approval
    set_contract_address(ADMIN());

    // Now attempt the mint
    erc721_mintable.minter_mint(PLAYER1().into());

    // Verify mint was successful
    let final_nft_balance = erc721.balance_of(PLAYER1().into());
    assert_eq!(final_nft_balance, 1, "Minting failed");
}

