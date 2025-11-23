// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AppStore
 * @dev Decentralized App Store con registro de apps y versiones
 * @notice Almacena referencias IPFS a manifests de apps, gestiona versiones
 */
contract AppStore is Ownable {
    
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
        uint256 totalDownloads; // Total de descargas
        bool exists;            // Si la app existe
        bool active;            // Si la app está activa (no baneada)
        uint256 createdAt;      // Timestamp de creación
    }
    
    // ============ State Variables ============
    
    // Mapeo de slug hash a App
    mapping(bytes32 => App) public apps;
    
    // Mapeo de slug hash a array de versiones
    mapping(bytes32 => Version[]) public versions;
    
    // Total de apps registradas
    uint256 public totalApps;
    
    // ============ Events ============
    
    event AppRegistered(
        bytes32 indexed appKey,
        string slug,
        address indexed publisher,
        string manifestCid
    );
    
    event VersionPublished(
        bytes32 indexed appKey,
        string manifestCid,
        uint256 versionCode
    );
    
    event AppDownloaded(
        bytes32 indexed appKey,
        address indexed downloader
    );
    
    event AppStatusChanged(
        bytes32 indexed appKey,
        bool active
    );
    
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
    
    constructor() Ownable(msg.sender) {}
    
    // ============ Main Functions ============
    
    /**
     * @notice Registra una nueva app en el store
     * @param slug Identificador único de la app
     * @param manifestCid CID del manifest en IPFS
     * @param versionCode Código de versión inicial
     */
    function registerApp(
        string calldata slug,
        string calldata manifestCid,
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
            totalDownloads: 0,
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
        
        emit AppRegistered(key, slug, msg.sender, manifestCid);
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
     * @notice Descarga una app (registra estadística)
     * @param slug Slug de la app
     */
    function downloadApp(string calldata slug) 
        external 
    {
        bytes32 key = keccak256(abi.encodePacked(slug));
        require(apps[key].exists, "App does not exist");
        require(apps[key].active, "App is not active");
        
        _recordDownload(key);
        emit AppDownloaded(key, msg.sender);
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
    
    // ============ Admin Functions ============
    
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
