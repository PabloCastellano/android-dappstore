// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AppStore} from "./AppStore.sol";
import {Test} from "forge-std/Test.sol";

contract AppStoreTest is Test {
    AppStore appStore;
    
    // Test addresses
    address owner = address(this);
    address publisher = address(0x1);
    address user = address(0x2);
    
    // Test data
    string constant TEST_SLUG = "my-awesome-app";
    string constant TEST_CID = "QmTest123";
    string constant TEST_CID_V2 = "QmTest456";
    uint256 constant TEST_VERSION = 1;
    
    function setUp() public {
        appStore = new AppStore();
    }
    
    // ============ Register App Tests ============
    
    function test_RegisterApp() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // Verify app was registered
        AppStore.App memory app = appStore.getApp(TEST_SLUG);
        assertEq(app.publisher, publisher);
        assertEq(app.slug, TEST_SLUG);
        assertEq(app.latestManifestCid, TEST_CID);
        assertEq(app.totalDownloads, 0);
        assertTrue(app.exists);
        assertTrue(app.active);
        
        // Verify total apps counter
        assertEq(appStore.totalApps(), 1);
        
        // Verify version was created
        assertEq(appStore.getVersionCount(TEST_SLUG), 1);
    }
    
    function test_RevertWhen_RegisterDuplicateSlug() public {
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        vm.expectRevert("App slug already exists");
        appStore.registerApp(TEST_SLUG, TEST_CID_V2, 2);
        vm.stopPrank();
    }
    
    function test_RevertWhen_RegisterEmptySlug() public {
        vm.prank(publisher);
        vm.expectRevert("Slug cannot be empty");
        appStore.registerApp("", TEST_CID, TEST_VERSION);
    }
    
    function test_RevertWhen_RegisterEmptyCid() public {
        vm.prank(publisher);
        vm.expectRevert("Manifest CID cannot be empty");
        appStore.registerApp(TEST_SLUG, "", TEST_VERSION);
    }
    
    // ============ Publish Version Tests ============
    
    function test_PublishVersion() public {
        // Register app first
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // Publish new version
        appStore.publishVersion(TEST_SLUG, TEST_CID_V2, 2);
        vm.stopPrank();
        
        // Verify version count
        assertEq(appStore.getVersionCount(TEST_SLUG), 2);
        
        // Verify latest manifest updated
        assertEq(appStore.getLatestManifest(TEST_SLUG), TEST_CID_V2);
        
        // Verify version details
        AppStore.Version memory version = appStore.getVersion(TEST_SLUG, 1);
        assertEq(version.manifestCid, TEST_CID_V2);
        assertEq(version.versionCode, 2);
        assertFalse(version.deprecated);
    }
    
    function test_RevertWhen_PublishVersionNotPublisher() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        vm.prank(user);
        vm.expectRevert("Not the publisher");
        appStore.publishVersion(TEST_SLUG, TEST_CID_V2, 2);
    }
    
    function test_RevertWhen_PublishVersionLowerCode() public {
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, 10);
        
        vm.expectRevert("Version code must be greater than previous");
        appStore.publishVersion(TEST_SLUG, TEST_CID_V2, 5);
        vm.stopPrank();
    }
    
    function test_RevertWhen_PublishVersionNonExistentApp() public {
        vm.prank(publisher);
        vm.expectRevert("App does not exist");
        appStore.publishVersion("non-existent", TEST_CID, 2);
    }
    
    // ============ Download App Tests ============
    
    function test_DownloadApp() public {
        // Register app
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // Download app
        vm.prank(user);
        appStore.downloadApp(TEST_SLUG);
        
        // Verify download was counted
        AppStore.App memory app = appStore.getApp(TEST_SLUG);
        assertEq(app.totalDownloads, 1);
    }
    
    function test_MultipleDownloads() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // Download multiple times
        vm.prank(user);
        appStore.downloadApp(TEST_SLUG);
        
        vm.prank(address(0x3));
        appStore.downloadApp(TEST_SLUG);
        
        // Verify downloads counted
        AppStore.App memory app = appStore.getApp(TEST_SLUG);
        assertEq(app.totalDownloads, 2);
    }
    
    function test_RevertWhen_DownloadNonExistentApp() public {
        vm.prank(user);
        vm.expectRevert("App does not exist");
        appStore.downloadApp("non-existent");
    }
    
    function test_RevertWhen_DownloadInactiveApp() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // Deactivate app
        appStore.setAppStatus(TEST_SLUG, false);
        
        vm.prank(user);
        vm.expectRevert("App is not active");
        appStore.downloadApp(TEST_SLUG);
    }
    
    // ============ Deprecate Version Tests ============
    
    function test_DeprecateVersion() public {
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        appStore.publishVersion(TEST_SLUG, TEST_CID_V2, 2);
        
        // Deprecate first version
        appStore.deprecateVersion(TEST_SLUG, 0);
        vm.stopPrank();
        
        AppStore.Version memory version = appStore.getVersion(TEST_SLUG, 0);
        assertTrue(version.deprecated);
    }
    
    function test_RevertWhen_DeprecateVersionNotPublisher() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        vm.prank(user);
        vm.expectRevert("Not the publisher");
        appStore.deprecateVersion(TEST_SLUG, 0);
    }
    
    function test_RevertWhen_DeprecateInvalidVersionIndex() public {
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        vm.expectRevert("Invalid version index");
        appStore.deprecateVersion(TEST_SLUG, 5);
        vm.stopPrank();
    }
    
    // ============ Admin Functions Tests ============
    
    function test_SetAppStatus() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // Deactivate app
        appStore.setAppStatus(TEST_SLUG, false);
        
        AppStore.App memory app = appStore.getApp(TEST_SLUG);
        assertFalse(app.active);
        
        // Reactivate app
        appStore.setAppStatus(TEST_SLUG, true);
        
        app = appStore.getApp(TEST_SLUG);
        assertTrue(app.active);
    }
    
    function test_RevertWhen_SetAppStatusNonExistent() public {
        vm.expectRevert("App does not exist");
        appStore.setAppStatus("non-existent", false);
    }
    
    function test_RevertWhen_SetAppStatusNotOwner() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        vm.prank(user);
        vm.expectRevert();
        appStore.setAppStatus(TEST_SLUG, false);
    }
    
    // ============ View Functions Tests ============
    
    function test_GetLatestManifest() public {
        vm.prank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        string memory manifest = appStore.getLatestManifest(TEST_SLUG);
        assertEq(manifest, TEST_CID);
    }
    
    function test_GetVersionCount() public {
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        appStore.publishVersion(TEST_SLUG, TEST_CID_V2, 2);
        vm.stopPrank();
        
        assertEq(appStore.getVersionCount(TEST_SLUG), 2);
    }
    
    // ============ Complex Scenario Tests ============
    
    function test_CompleteAppLifecycle() public {
        // 1. Register app
        vm.startPrank(publisher);
        appStore.registerApp(TEST_SLUG, TEST_CID, TEST_VERSION);
        
        // 2. Publish new version
        appStore.publishVersion(TEST_SLUG, TEST_CID_V2, 2);
        vm.stopPrank();
        
        // 3. Download by user
        vm.prank(user);
        appStore.downloadApp(TEST_SLUG);
        
        // 4. Verify final state
        AppStore.App memory app = appStore.getApp(TEST_SLUG);
        assertEq(app.totalDownloads, 1);
        assertEq(appStore.getVersionCount(TEST_SLUG), 2);
    }
    
    function test_MultipleApps() public {
        // Register multiple apps
        vm.startPrank(publisher);
        appStore.registerApp("app1", TEST_CID, 1);
        appStore.registerApp("app2", TEST_CID, 1);
        appStore.registerApp("app3", TEST_CID, 1);
        vm.stopPrank();
        
        assertEq(appStore.totalApps(), 3);
        
        // Download all apps
        vm.startPrank(user);
        appStore.downloadApp("app1");
        appStore.downloadApp("app2");
        appStore.downloadApp("app3");
        vm.stopPrank();
        
        // Verify downloads
        assertEq(appStore.getApp("app1").totalDownloads, 1);
        assertEq(appStore.getApp("app2").totalDownloads, 1);
        assertEq(appStore.getApp("app3").totalDownloads, 1);
    }
}
