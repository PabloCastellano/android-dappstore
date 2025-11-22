// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AppStore
 * @dev Decentralized App Store con registro de apps, versiones y pagos
 * @notice Almacena referencias IPFS a manifests de apps, gestiona versiones y pagos
 */
contract AppStore is Ownable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct Version {
        string manifestCid;      // CID del manifest en IPFS
        uint256 timestamp;       // Timestamp de publicación
        uint256 versionCode;     // Código de versión numérico
        bool deprecated;         // Si la versión está deprecada
    }
    
    struct App {
        address publisher;       // Address del desarrollador
        string slug;            // Identificador único (ej: "my-app")
        string latestManifestCid; // CID del manifest más reciente
        uint256 priceWei;       // Precio en wei (0 = gratis)
        uint256 totalDownloads; // Total de descargas
        uint256 totalRevenue;   // Revenue total generado
        bool exists;            // Si la app existe
        bool active;            // Si la app está activa (no baneada)
        uint256 createdAt;      // Timestamp de creación
    }
    
    struct Purchase {
        address buyer;
        uint256 timestamp;
        uint256 pricePaid;
    }
    
    // ============ State Variables ============
    
    // Mapeo de slug hash a App
    mapping(bytes32 => App) public apps;
    
    // Mapeo de slug hash a array de versiones
    mapping(bytes32 => Version[]) public versions;
    
    // Mapeo de usuario -> slug hash -> si ha comprado
    mapping(address => mapping(bytes32 => bool)) public hasPurchased;
    
    // Mapeo de slug hash -> array de compras
    mapping(bytes32 => Purchase[]) public purchases;
    
    // Fee de la plataforma (en basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5% por defecto
    
    // Address donde se acumulan los fees
    address public feeCollector;
    
    // Total de apps registradas
    uint256 public totalApps;
    
    // ============ Events ============
    
    event AppRegistered(
        bytes32 indexed appKey,
        string slug,
        address indexed publisher,
        string manifestCid,
        uint256 priceWei
    );
    
    event VersionPublished(
        bytes32 indexed appKey,
        string manifestCid,
        uint256 versionCode
    );
    
    event AppPurchased(
        bytes32 indexed appKey,
        address indexed buyer,
        uint256 amountPaid,
        uint256 platformFee
    );
    
    event AppDownloaded(
        bytes32 indexed appKey,
        address indexed downloader
    );
    
    event AppUpdated(
        bytes32 indexed appKey,
        uint256 newPrice
    );
    
    event AppStatusChanged(
        bytes32 indexed appKey,
        bool active
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    
    event FeeCollectorUpdated(address newCollector);
    
    // ============ Modifiers ============
    
    modifier onlyPublisher(bytes32 appKey) {
        require(apps[appKey].publisher == msg.sender, "Not the publisher");
        _;
    }
    
    modifier appExists(bytes32 appKey) {
        require(apps[appKey].exists, "App does not exist");
        _;
    }
    
    modifier appActive(bytes32 appKey) {
        require(apps[appKey].active, "App is not active");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        feeCollector = msg.sender;
    }
    
    // ============ Main Functions ============
    
    /**
     * @notice Registra una nueva app en el store
     * @param slug Identificador único de la app
     * @param manifestCid CID del manifest en IPFS
     * @param priceWei Precio en wei (0 para gratis)
     * @param versionCode Código de versión inicial
     */
    function registerApp(
        string calldata slug,
        string calldata manifestCid,
        uint256 priceWei,
        uint256 versionCode
    ) external {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(!apps[key].exists, "App slug already exists");
        require(bytes(slug).length > 0, "Slug cannot be empty");
        require(bytes(manifestCid).length > 0, "Manifest CID cannot be empty");
        
        apps[key] = App({
            publisher: msg.sender,
            slug: slug,
            latestManifestCid: manifestCid,
            priceWei: priceWei,
            totalDownloads: 0,
            totalRevenue: 0,
            exists: true,
            active: true,
            createdAt: block.timestamp
        });
        
        versions[key].push(Version({
            manifestCid: manifestCid,
            timestamp: block.timestamp,
            versionCode: versionCode,
            deprecated: false
        }));
        
        totalApps++;
        
        emit AppRegistered(key, slug, msg.sender, manifestCid, priceWei);
        emit VersionPublished(key, manifestCid, versionCode);
    }
    
    /**
     * @notice Publica una nueva versión de la app
     * @param slug Slug de la app
     * @param manifestCid CID del nuevo manifest
     * @param versionCode Código de la nueva versión
     */
    function publishVersion(
        string calldata slug,
        string calldata manifestCid,
        uint256 versionCode
    ) external {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].publisher == msg.sender, "Not the publisher");
        require(bytes(manifestCid).length > 0, "Manifest CID cannot be empty");
        
        // Verificar que el versionCode sea mayor que el anterior
        if (versions[key].length > 0) {
            require(
                versionCode > versions[key][versions[key].length - 1].versionCode,
                "Version code must be greater than previous"
            );
        }
        
        apps[key].latestManifestCid = manifestCid;
        
        versions[key].push(Version({
            manifestCid: manifestCid,
            timestamp: block.timestamp,
            versionCode: versionCode,
            deprecated: false
        }));
        
        emit VersionPublished(key, manifestCid, versionCode);
    }
    
    /**
     * @notice Compra una app (o registra descarga si es gratis)
     * @param slug Slug de la app
     */
    function purchaseApp(string calldata slug) 
        external 
        payable 
        nonReentrant 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].active, "App is not active");
        
        uint256 price = apps[key].priceWei;
        
        // Si la app es gratis, solo registrar descarga
        if (price == 0) {
            _recordDownload(key);
            emit AppDownloaded(key, msg.sender);
            return;
        }
        
        // Si ya compró, no puede comprar de nuevo (pero puede re-descargar)
        require(!hasPurchased[msg.sender][key], "Already purchased");
        require(msg.value >= price, "Insufficient payment");
        
        // Calcular fee de plataforma
        uint256 fee = (price * platformFee) / 10000;
        uint256 publisherAmount = price - fee;
        
        // Marcar como comprado
        hasPurchased[msg.sender][key] = true;
        
        // Registrar compra
        purchases[key].push(Purchase({
            buyer: msg.sender,
            timestamp: block.timestamp,
            pricePaid: price
        }));
        
        // Actualizar estadísticas
        apps[key].totalDownloads++;
        apps[key].totalRevenue += price;
        
        // Transferir fondos
        (bool successPublisher, ) = apps[key].publisher.call{value: publisherAmount}("");
        require(successPublisher, "Transfer to publisher failed");
        
        if (fee > 0) {
            (bool successFee, ) = feeCollector.call{value: fee}("");
            require(successFee, "Transfer fee failed");
        }
        
        // Devolver exceso si pagó de más
        if (msg.value > price) {
            (bool successRefund, ) = msg.sender.call{value: msg.value - price}("");
            require(successRefund, "Refund failed");
        }
        
        emit AppPurchased(key, msg.sender, price, fee);
    }
    
    /**
     * @notice Actualiza el precio de una app
     * @param slug Slug de la app
     * @param newPriceWei Nuevo precio en wei
     */
    function updatePrice(string calldata slug, uint256 newPriceWei) 
        external 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].publisher == msg.sender, "Not the publisher");
        
        apps[key].priceWei = newPriceWei;
        
        emit AppUpdated(key, newPriceWei);
    }
    
    /**
     * @notice Depreca una versión específica
     * @param slug Slug de la app
     * @param versionIndex Índice de la versión a deprecar
     */
    function deprecateVersion(string calldata slug, uint256 versionIndex) 
        external 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].publisher == msg.sender, "Not the publisher");
        require(versionIndex < versions[key].length, "Invalid version index");
        
        versions[key][versionIndex].deprecated = true;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Obtiene el manifest CID más reciente de una app
     */
    function getLatestManifest(string calldata slug) 
        external 
        view 
        returns (string memory) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        return apps[key].latestManifestCid;
    }
    
    /**
     * @notice Obtiene el número de versiones de una app
     */
    function getVersionCount(string calldata slug) 
        external 
        view 
        returns (uint256) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        return versions[key].length;
    }
    
    /**
     * @notice Obtiene una versión específica
     */
    function getVersion(string calldata slug, uint256 index) 
        external 
        view 
        returns (Version memory) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(index < versions[key].length, "Invalid version index");
        return versions[key][index];
    }
    
    /**
     * @notice Verifica si un usuario ha comprado una app
     */
    function hasUserPurchased(address user, string calldata slug) 
        external 
        view 
        returns (bool) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        return hasPurchased[user][key];
    }
    
    /**
     * @notice Obtiene información completa de una app
     */
    function getApp(string calldata slug) 
        external 
        view 
        returns (App memory) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        return apps[key];
    }
    
    /**
     * @notice Obtiene el número de compras de una app
     */
    function getPurchaseCount(string calldata slug) 
        external 
        view 
        returns (uint256) 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        return purchases[key].length;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Actualiza el fee de la plataforma (solo owner)
     * @param newFee Nuevo fee en basis points (100 = 1%)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high (max 10%)");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }
    
    /**
     * @notice Actualiza la address del fee collector (solo owner)
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector);
    }
    
    /**
     * @notice Activa o desactiva una app (moderación, solo owner)
     */
    function setAppStatus(string calldata slug, bool active) external onlyOwner {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        apps[key].active = active;
        emit AppStatusChanged(key, active);
    }
    
    // ============ Internal Functions ============
    
    function _recordDownload(bytes32 key) internal {
        apps[key].totalDownloads++;
    }
}
