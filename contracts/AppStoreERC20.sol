// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AppStoreERC20
 * @dev Extensión del AppStore que soporta pagos con tokens ERC20 (USDC, DAI, etc)
 * @notice Permite comprar apps con stablecoins para evitar volatilidad
 */
contract AppStoreERC20 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct TokenPrice {
        address tokenAddress;
        uint256 price;
        bool enabled;
    }
    
    struct App {
        address publisher;
        string slug;
        string latestManifestCid;
        mapping(address => uint256) tokenPrices; // token address => price
        uint256 totalDownloads;
        bool exists;
        bool active;
        uint256 createdAt;
    }
    
    // ============ State Variables ============
    
    mapping(bytes32 => App) public apps;
    mapping(address => mapping(bytes32 => bool)) public hasPurchased;
    
    // Tokens soportados
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    uint256 public platformFee = 250; // 2.5%
    address public feeCollector;
    uint256 public totalApps;
    
    // ============ Events ============
    
    event AppRegistered(
        bytes32 indexed appKey,
        string slug,
        address indexed publisher
    );
    
    event TokenPriceSet(
        bytes32 indexed appKey,
        address indexed token,
        uint256 price
    );
    
    event AppPurchasedWithToken(
        bytes32 indexed appKey,
        address indexed buyer,
        address indexed token,
        uint256 amount
    );
    
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        feeCollector = msg.sender;
    }
    
    // ============ Main Functions ============
    
    /**
     * @notice Registra una nueva app
     */
    function registerApp(
        string calldata slug,
        string calldata manifestCid
    ) external {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(!apps[key].exists, "App already exists");
        
        App storage app = apps[key];
        app.publisher = msg.sender;
        app.slug = slug;
        app.latestManifestCid = manifestCid;
        app.exists = true;
        app.active = true;
        app.createdAt = block.timestamp;
        
        totalApps++;
        
        emit AppRegistered(key, slug, msg.sender);
    }
    
    /**
     * @notice Establece el precio de una app en un token específico
     */
    function setTokenPrice(
        string calldata slug,
        address token,
        uint256 price
    ) external {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].publisher == msg.sender, "Not the publisher");
        require(supportedTokens[token], "Token not supported");
        
        apps[key].tokenPrices[token] = price;
        
        emit TokenPriceSet(key, token, price);
    }
    
    /**
     * @notice Compra una app con un token ERC20
     */
    function purchaseAppWithToken(
        string calldata slug,
        address token,
        uint256 amount
    ) external nonReentrant {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].active, "App not active");
        require(supportedTokens[token], "Token not supported");
        require(!hasPurchased[msg.sender][key], "Already purchased");
        
        uint256 price = apps[key].tokenPrices[token];
        require(price > 0, "Price not set for this token");
        require(amount >= price, "Insufficient amount");
        
        // Calcular fee
        uint256 fee = (price * platformFee) / 10000;
        uint256 publisherAmount = price - fee;
        
        // Marcar como comprado
        hasPurchased[msg.sender][key] = true;
        apps[key].totalDownloads++;
        
        // Transferir tokens
        IERC20 tokenContract = IERC20(token);
        
        tokenContract.safeTransferFrom(msg.sender, apps[key].publisher, publisherAmount);
        
        if (fee > 0) {
            tokenContract.safeTransferFrom(msg.sender, feeCollector, fee);
        }
        
        emit AppPurchasedWithToken(key, msg.sender, token, price);
    }
    
    // ============ View Functions ============
    
    function getTokenPrice(string calldata slug, address token) 
        external 
        view 
        returns (uint256) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        return apps[key].tokenPrices[token];
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    // ============ Admin Functions ============
    
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        tokenList.push(token);
        
        emit TokenAdded(token);
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        
        // Remover del array
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(token);
    }
    
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high");
        platformFee = newFee;
    }
    
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
    }
}
