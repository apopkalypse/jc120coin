// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract JazzERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    mapping (address => uint256) private _balances;
    mapping (address => mapping(address => uint256)) private _allowances;
    mapping (address => bool) private _admins;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RoleUpdate(address indexed account, bool isAdmin);

    constructor(string memory __name, string memory __symbol, uint8 __decimals, uint256 __totalSupply) {
        _admins[msg.sender] = true;
        _name = __name;
        _symbol = __symbol;
        _decimals = __decimals;
        _totalSupply = __totalSupply;
        _balances[msg.sender] = __totalSupply;
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        require(recipient != address(0), "You may not transfer to the zero address.");
        require(_balances[msg.sender] >= amount, "Your balance is too low.");
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        require(recipient != address(0), "You may not transfer to the zero address.");
        require(_allowances[sender][msg.sender] >= amount, "You are not approved to transfer these doinks.");
        require(_balances[sender] >= amount, "Sender balance is too low.");
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        _allowances[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "You may not create an allowance for the zero address.");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function mint(address account, uint256 amount) external returns (bool) {
        require(_admins[msg.sender] == true, "Only an admin may create tokens.");
        require(account != address(0), "You may not mint tokens to the zero address.");
        _balances[account] += amount;
        _totalSupply += amount;
        emit Transfer(address(0), account, amount);
        return true;
    }

    function burn(address account, uint256 amount) external returns (bool) {
        require(_admins[msg.sender] == true, "Only an admin may destroy tokens.");
        require(account != address(0), "You may not destroy tokens assigned to the zero address.");
        require(_balances[account] >= amount, "Account balance is too low.");
        require(_totalSupply >= amount, "Total supply is too low.");
        _balances[account] -= amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
        return true;
    }

    function setRole(address account, bool isAdmin) external returns (bool) {
        require(_admins[msg.sender] == true, "Only an admin may set roles.");
        require(account != address(0), "You may not assign a role to the zero address.");
        _admins[account] = isAdmin;
        emit RoleUpdate(account, isAdmin);
        return true;
    }
}
