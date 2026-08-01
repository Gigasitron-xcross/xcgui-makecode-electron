# XC_GUI MakeCode micro:bit V2 Build Commands

> Updated 1 August 2026: added the confirmed Electron desktop-wrapper, portable-build, testing, and release workflow.

This file records the command-line workflow for the working XC_GUI MakeCode setup.

## 1. Current repositories and branches

### PXT target

```text
C:\Users\admin\Documents\Development\XC_GUI_MakeCode\pxt-microbit-xcgui-clean
```

Working branch:

```text
xcgui-offline-v2
```

### Custom CODAL repository

```text
C:\Users\admin\Documents\Development\XC_GUI_MakeCode\codal-microbit-v2-xcgui
```

Repository:

```text
https://github.com/Gigasitron-xcross/codal-microbit-v2-xcgui.git
```

Current development branch used in the latest setup:

```text
xcgui-v0.3.5-dev1
```

An earlier successful build log used:

```text
xcgui-v0.3.5-1
```

Use the branch currently specified by the PXT target configuration.

---

## 2. Open PowerShell and define the paths

```powershell
$PxtRoot = "C:\Users\admin\Documents\Development\XC_GUI_MakeCode\pxt-microbit-xcgui-clean"

$CodalRoot = "C:\Users\admin\Documents\Development\XC_GUI_MakeCode\codal-microbit-v2-xcgui"

$XcGuiPackage = Join-Path $PxtRoot "libs\xcgui"
```

Check the paths:

```powershell
Test-Path $PxtRoot
Test-Path $CodalRoot
Test-Path $XcGuiPackage
```

All three commands should return:

```text
True
```

---

## 3. Check the required tools

```powershell
node --version
npm --version
git --version
docker version
```

Test Docker:

```powershell
docker run --rm hello-world
```

Check that Docker is using Linux containers:

```powershell
docker info --format '{{.OSType}}'
```

Expected result:

```text
linux
```

---

## 4. Clone the custom CODAL repository

Run this only when creating a new working copy:

```powershell
Set-Location "C:\Users\admin\Documents\Development\XC_GUI_MakeCode"

git clone `
    "https://github.com/Gigasitron-xcross/codal-microbit-v2-xcgui.git"

Set-Location $CodalRoot
```

List the available branches:

```powershell
git branch -a
```

Switch to the working branch:

```powershell
git checkout xcgui-v0.3.5-dev1
```

Update it:

```powershell
git pull origin xcgui-v0.3.5-dev1
```

Check the current branch:

```powershell
git branch --show-current
```

---

## 5. XC_GUI files inside the CODAL repository

The static XC_GUI archive is stored at:

```text
lib\xcgui\libXC_GUI.a
```

The required headers are stored in the same CODAL XC_GUI library area, including:

```text
LCD.h
XC_GUI_Types.h
XGUI.h
```

Check the archive:

```powershell
Set-Location $CodalRoot

Get-Item ".\lib\xcgui\libXC_GUI.a"
```

List the XC_GUI CODAL files:

```powershell
Get-ChildItem ".\lib\xcgui" -Recurse
```

### Replace the archive after rebuilding XC_GUI

Set the actual source path of the newly built archive:

```powershell
$NewArchive = "C:\PATH\TO\NEW\libXC_GUI.a"
```

Copy it into CODAL:

```powershell
Copy-Item `
    -Path $NewArchive `
    -Destination "$CodalRoot\lib\xcgui\libXC_GUI.a" `
    -Force
```

Confirm its timestamp and size:

```powershell
Get-Item "$CodalRoot\lib\xcgui\libXC_GUI.a" |
    Select-Object FullName, Length, LastWriteTime
```

---

## 6. Commit and push CODAL changes

```powershell
Set-Location $CodalRoot

git status
git add .
git commit -m "Update XC_GUI library for MakeCode microbit V2"
git push origin xcgui-v0.3.5-dev1
```

Create a release tag when required:

```powershell
git tag xcgui-v0.3.5-dev1-release1
git push origin xcgui-v0.3.5-dev1-release1
```

List tags:

```powershell
git tag --list
```

---

## 7. Critical PXT CODAL target configuration

The custom PXT target must point to the custom CODAL repository and branch.

The relevant configuration should use values similar to:

```json
{
    "name": "codal-microbit-v2",
    "url": "https://github.com/Gigasitron-xcross/codal-microbit-v2-xcgui",
    "branch": "xcgui-v0.3.5-dev1",
    "type": "git"
}
```

When changing the CODAL branch, update this configuration before rebuilding the PXT target.

Search for the configured CODAL branch:

```powershell
Set-Location $PxtRoot

Get-ChildItem -Recurse -File |
    Select-String `
        -Pattern "codal-microbit-v2-xcgui|xcgui-v0.3.5"
```

---

## 8. Prepare the PXT target

```powershell
Set-Location $PxtRoot
```

Check the PXT branch:

```powershell
git branch --show-current
```

Switch to the working branch when necessary:

```powershell
git checkout xcgui-offline-v2
```

Update it:

```powershell
git pull origin xcgui-offline-v2
```

Install Node dependencies after a new clone or after changing package files:

```powershell
npm install
```

Check the local PXT command:

```powershell
npx pxt --version
```

---

## 9. Required build environment variables

Set these variables in every new PowerShell session before building:

```powershell
$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"
```

Check them:

```powershell
$env:PXT_COMPILE_SWITCHES
$env:PXT_FORCE_LOCAL
```

Expected values:

```text
csv---mbcodal
1
```

These settings select the micro:bit V2 CODAL build path and force the local build workflow.

---

## 10. Clean the PXT target

```powershell
Set-Location $PxtRoot

npx pxt clean
```

Remove only the XC_GUI package output when a package-level clean is needed:

```powershell
Remove-Item `
    "$XcGuiPackage\built" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue
```

---

## 11. Build the complete PXT target

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt buildtarget --local
```

Save the build output to a log:

```powershell
npx pxt buildtarget --local 2>&1 |
    Tee-Object ".\buildtarget-debug.txt"
```

The target build uses the configured custom CODAL Git repository.

---

## 12. Build the XC_GUI extension test project

```powershell
Set-Location $XcGuiPackage

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt build --localbuild
```

Save the output to a log:

```powershell
npx pxt build --localbuild 2>&1 |
    Tee-Object ".\xcgui-build-debug.txt"
```

The generated HEX should be:

```text
libs\xcgui\built\binary.hex
```

Check it:

```powershell
Get-Item "$XcGuiPackage\built\binary.hex" |
    Select-Object FullName, Length, LastWriteTime
```

Copy it to another folder:

```powershell
Copy-Item `
    "$XcGuiPackage\built\binary.hex" `
    "$env:USERPROFILE\Downloads\xcgui-microbit-v2.hex" `
    -Force
```

---

## 13. Full clean rebuild sequence

Use this after changing C++, the XC_GUI archive, CODAL configuration, or PXT shims:

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt clean

Remove-Item `
    "$XcGuiPackage\built" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

npx pxt buildtarget --local

Set-Location $XcGuiPackage

npx pxt build --localbuild
```

Check the final HEX:

```powershell
Get-Item ".\built\binary.hex" |
    Select-Object FullName, Length, LastWriteTime
```

---

## 14. Run the local MakeCode editor

From the PXT target root:

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt serve --localbuild
```

The local editor is normally opened using the URL printed by PXT, commonly:

```text
http://localhost:3232
```

Stop the server with:

```text
Ctrl+C
```

After changing native C++ code, PXT package metadata, or CODAL settings:

1. Stop the server.
2. Rebuild.
3. Start `pxt serve --localbuild` again.
4. Reload the browser using `Ctrl+Shift+R`.

---

## 15. Build a static editor package

Run this only after the local editor and hardware build are working:

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt clean
npx pxt buildtarget --local

npx pxt staticpkg `
    --route xcgui `
    --output ".\release\editor" `
    --minify
```

Test the static package through a normal HTTP origin:

```powershell
Set-Location $PxtRoot

py -m http.server 8080 `
    --directory ".\release\editor"
```

Open:

```text
http://localhost:8080/xcgui/index.html
```

Stop the server with:

```text
Ctrl+C
```

The normal HTTP origin is important because the static MakeCode compiler, project
storage, workers, and service-worker-related browser features may not behave
correctly under a custom Electron URL scheme.

---

## 16. Back up a MakeCode project from its HEX

Create an empty destination folder:

```powershell
$ProjectBackup = "C:\Users\admin\Documents\Development\XC_GUI_MakeCode\SavedProjects\XC_GUI_Project"

New-Item `
    -ItemType Directory `
    -Path $ProjectBackup `
    -Force | Out-Null

Set-Location $ProjectBackup
```

Extract an embedded MakeCode project from a downloaded HEX:

```powershell
& "$PxtRoot\node_modules\.bin\pxt.cmd" extract `
    "$env:USERPROFILE\Downloads\microbit-XC-GUI.hex"
```

Or, when `npx pxt` resolves the correct local target:

```powershell
npx pxt extract `
    "$env:USERPROFILE\Downloads\microbit-XC-GUI.hex"
```

List the recovered files:

```powershell
Get-ChildItem -Recurse
```

---

## 17. Useful Git checks

### PXT repository

```powershell
Set-Location $PxtRoot

git status
git branch --show-current
git log -1 --oneline
git remote -v
```

### CODAL repository

```powershell
Set-Location $CodalRoot

git status
git branch --show-current
git log -1 --oneline
git remote -v
```

---

## 18. Useful diagnostic commands

Check the custom CODAL URL and branch in generated logs:

```powershell
Select-String `
    -Path "$PxtRoot\buildtarget-debug.txt" `
    -Pattern "codal-microbit-v2-xcgui|branch|dockeryotta|mbcodal"
```

Find generated HEX files:

```powershell
Get-ChildItem `
    -Path $PxtRoot `
    -Filter "*.hex" `
    -Recurse |
    Select-Object FullName, Length, LastWriteTime |
    Sort-Object LastWriteTime -Descending
```

Find XC_GUI archives:

```powershell
Get-ChildItem `
    -Path "C:\Users\admin\Documents\Development\XC_GUI_MakeCode" `
    -Filter "libXC_GUI.a" `
    -Recurse |
    Select-Object FullName, Length, LastWriteTime
```

Find all PXT package files:

```powershell
Get-ChildItem `
    -Path $PxtRoot `
    -Filter "pxt.json" `
    -Recurse |
    Select-Object FullName
```

---

## 19. Short everyday workflow

### After changing only `xcgui.ts`, `xcgui.cpp`, or `test.ts`

```powershell
Set-Location $XcGuiPackage

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt build --localbuild
```

### After changing the CODAL repository or `libXC_GUI.a`

```powershell
Set-Location $CodalRoot

git add .
git commit -m "Update XC_GUI CODAL integration"
git push origin xcgui-v0.3.5-dev1

Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt clean
npx pxt buildtarget --local

Set-Location $XcGuiPackage

npx pxt build --localbuild
```

### Start the editor

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt serve --localbuild
```

---

## 20. Important note about the CODAL build

In this working setup, the normal CODAL application build is initiated by PXT:

```powershell
npx pxt buildtarget --local
```

or:

```powershell
npx pxt build --localbuild
```

PXT reads the configured custom CODAL Git repository and performs the native build using its Docker-based CODAL build engine. Therefore, a separate standalone CMake command is not part of the confirmed working workflow recorded here.

The file `lib\xcgui\libXC_GUI.a` must already be present in the custom CODAL repository before PXT starts the native build.
---

## 21. Electron desktop-wrapper overview

The confirmed desktop release uses Electron as a portable Windows application.

The working arrangement is:

```text
PXT target
    ↓
npx pxt staticpkg
    ↓
release\editor\xcgui\index.html
    ↓
copy release\editor into xcgui-electron\editor
    ↓
Electron starts a local HTTP server on 127.0.0.1
    ↓
Electron opens http://127.0.0.1:32145/xcgui/index.html
    ↓
portable\XC_GUI MakeCode\XC_GUI MakeCode.exe
```

A custom protocol such as:

```text
xcgui://editor/xcgui/index.html
```

was able to display the editor, but it caused MakeCode project-storage and
compiler problems. The confirmed working version serves the static editor from:

```text
http://127.0.0.1:32145/xcgui/index.html
```

The loopback HTTP origin also gives the application a stable origin for
persistent project storage.

### What is required on the developer computer

```text
Node.js
npm
Electron
PXT dependencies
Docker only when rebuilding the native micro:bit V2 CODAL target
```

### What is required on the end-user computer

```text
Nothing needs to be installed.
```

The end user does not need:

```text
Docker
Node.js
npm
Python
Electron Forge
Visual Studio
```

The complete portable folder contains the Electron runtime and the static
XC_GUI MakeCode editor.

---

## 22. Electron project folder

The Electron project used in this setup is:

```text
C:\Users\admin\Documents\Development\XC_GUI_MakeCode\xcgui-electron
```

Define the paths:

```powershell
$PxtRoot = "C:\Users\admin\Documents\Development\XC_GUI_MakeCode\pxt-microbit-xcgui-clean"

$ElectronRoot = "C:\Users\admin\Documents\Development\XC_GUI_MakeCode\xcgui-electron"
```

Create the Electron project folder when it does not exist:

```powershell
New-Item `
    -ItemType Directory `
    -Path $ElectronRoot `
    -Force | Out-Null

Set-Location $ElectronRoot
```

For a fresh Electron project, create `package.json`:

```powershell
$PackageJson = @'
{
    "name": "xcgui-makecode",
    "productName": "XC_GUI MakeCode",
    "version": "0.1.0",
    "description": "XC_GUI MakeCode editor for micro:bit V2",
    "main": "main.js",
    "scripts": {
        "start": "electron ."
    },
    "author": "Gigasitron",
    "license": "UNLICENSED",
    "devDependencies": {
        "electron": "^43.2.0"
    }
}
'@

[System.IO.File]::WriteAllText(
    (Join-Path $ElectronRoot "package.json"),
    $PackageJson,
    [System.Text.UTF8Encoding]::new($false)
)
```

Install Electron:

```powershell
Set-Location $ElectronRoot

npm install
```

Check the installed Electron runtime:

```powershell
Test-Path ".\node_modules\electron\dist\electron.exe"

& ".\node_modules\.bin\electron.cmd" --version
```

The first command should return:

```text
True
```

---

## 23. Copy the static MakeCode editor into Electron

Build the static package first:

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt clean
npx pxt buildtarget --local

npx pxt staticpkg `
    --route xcgui `
    --output ".\release\editor" `
    --minify
```

Check the static editor entry:

```powershell
Test-Path `
    "$PxtRoot\release\editor\xcgui\index.html"
```

Expected:

```text
True
```

Replace the Electron copy of the editor:

```powershell
Remove-Item `
    "$ElectronRoot\editor" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

New-Item `
    -ItemType Directory `
    -Path "$ElectronRoot\editor" `
    -Force | Out-Null

robocopy `
    "$PxtRoot\release\editor" `
    "$ElectronRoot\editor" `
    /E `
    /R:1 `
    /W:1 `
    /MT:16 `
    /NFL `
    /NDL `
    /NP

if ($LASTEXITCODE -ge 8) {
    throw "Unable to copy the static MakeCode editor. Robocopy code: $LASTEXITCODE"
}
```

Verify the copied package:

```powershell
Test-Path `
    "$ElectronRoot\editor\xcgui\index.html"
```

Expected:

```text
True
```

---

## 24. Working Electron `main.js`

The confirmed working wrapper starts a local HTTP server and opens the static
editor in an Electron `BrowserWindow`.

Create:

```text
xcgui-electron\main.js
```

with the following content:

```javascript
const {
    app,
    BrowserWindow,
    session
} = require("electron");

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = 32145;

const SESSION_PARTITION =
    "persist:xcgui-editor-http-v1";

const MICROBIT_VENDOR_ID = 0x0d28;

let mainWindow = null;
let localServer = null;

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".wasm": "application/wasm",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".webmanifest": "application/manifest+json",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".hex": "text/plain; charset=utf-8",
    ".uf2": "application/octet-stream",
    ".bin": "application/octet-stream"
};

function sendText(response, statusCode, text) {
    response.writeHead(statusCode, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
    });

    response.end(text);
}

function startLocalServer() {
    const editorRoot = path.resolve(
        app.getAppPath(),
        "editor"
    );

    console.log(
        "Application path:",
        app.getAppPath()
    );

    console.log(
        "Editor root:",
        editorRoot
    );

    if (!fs.existsSync(editorRoot)) {
        return Promise.reject(
            new Error(
                `Editor folder not found: ${editorRoot}`
            )
        );
    }

    localServer = http.createServer(
        (request, response) => {
            try {
                const requestUrl = new URL(
                    request.url,
                    `http://${HOST}:${PORT}`
                );

                let relativePath =
                    decodeURIComponent(
                        requestUrl.pathname
                    ).replace(/^\/+/, "");

                if (!relativePath) {
                    relativePath =
                        "xcgui/index.html";
                }

                let requestedFile =
                    path.resolve(
                        editorRoot,
                        relativePath
                    );

                const rootWithSeparator =
                    (
                        editorRoot +
                        path.sep
                    ).toLowerCase();

                const requestedLower =
                    requestedFile.toLowerCase();

                const insideEditor =
                    requestedLower ===
                        editorRoot.toLowerCase() ||
                    requestedLower.startsWith(
                        rootWithSeparator
                    );

                if (!insideEditor) {
                    sendText(
                        response,
                        403,
                        "Forbidden"
                    );

                    return;
                }

                if (
                    fs.existsSync(requestedFile) &&
                    fs.statSync(
                        requestedFile
                    ).isDirectory()
                ) {
                    requestedFile = path.join(
                        requestedFile,
                        "index.html"
                    );
                }

                if (
                    !fs.existsSync(requestedFile) ||
                    !fs.statSync(
                        requestedFile
                    ).isFile()
                ) {
                    console.error(
                        "HTTP file not found:",
                        requestedFile
                    );

                    sendText(
                        response,
                        404,
                        "File not found"
                    );

                    return;
                }

                const extension =
                    path.extname(
                        requestedFile
                    ).toLowerCase();

                const contentType =
                    MIME_TYPES[extension] ||
                    "application/octet-stream";

                const fileSize =
                    fs.statSync(
                        requestedFile
                    ).size;

                response.writeHead(200, {
                    "Content-Type":
                        contentType,

                    "Content-Length":
                        fileSize,

                    "Cache-Control":
                        "no-cache"
                });

                if (request.method === "HEAD") {
                    response.end();
                    return;
                }

                const fileStream =
                    fs.createReadStream(
                        requestedFile
                    );

                fileStream.on(
                    "error",
                    error => {
                        console.error(
                            "Unable to read file:",
                            requestedFile,
                            error
                        );

                        if (
                            !response.headersSent
                        ) {
                            sendText(
                                response,
                                500,
                                "Unable to read file"
                            );
                        } else {
                            response.destroy(
                                error
                            );
                        }
                    }
                );

                fileStream.pipe(response);
            } catch (error) {
                console.error(
                    "HTTP request failed:",
                    error
                );

                sendText(
                    response,
                    500,
                    "Internal server error"
                );
            }
        }
    );

    return new Promise(
        (resolve, reject) => {
            localServer.once(
                "error",
                reject
            );

            localServer.listen(
                PORT,
                HOST,
                () => {
                    localServer.removeListener(
                        "error",
                        reject
                    );

                    const editorOrigin =
                        `http://${HOST}:${PORT}`;

                    console.log(
                        "XC_GUI local server:",
                        editorOrigin
                    );

                    resolve(editorOrigin);
                }
            );
        }
    );
}

function configureUsbAccess(
    editorSession,
    editorOrigin
) {
    editorSession.setPermissionCheckHandler(
        (
            _webContents,
            permission,
            requestingOrigin
        ) => {
            return (
                permission === "usb" &&
                requestingOrigin.startsWith(
                    editorOrigin
                )
            );
        }
    );

    editorSession.setPermissionRequestHandler(
        (
            webContents,
            permission,
            callback
        ) => {
            const requestingUrl =
                webContents?.getURL() || "";

            callback(
                permission === "usb" &&
                requestingUrl.startsWith(
                    editorOrigin
                )
            );
        }
    );

    editorSession.setDevicePermissionHandler(
        details => {
            return (
                details.deviceType === "usb" &&
                details.origin.startsWith(
                    editorOrigin
                ) &&
                details.device.vendorId ===
                    MICROBIT_VENDOR_ID
            );
        }
    );

    editorSession.on(
        "select-usb-device",
        (
            event,
            details,
            callback
        ) => {
            event.preventDefault();

            const microbit =
                details.deviceList.find(
                    device =>
                        device.vendorId ===
                        MICROBIT_VENDOR_ID
                );

            callback(
                microbit
                    ? microbit.deviceId
                    : ""
            );
        }
    );
}

function createMainWindow(editorOrigin) {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 950,
        minWidth: 1100,
        minHeight: 700,
        title: "XC_GUI MakeCode",

        webPreferences: {
            partition:
                SESSION_PARTITION,

            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    const editorUrl =
        `${editorOrigin}/xcgui/index.html`;

    console.log(
        "Loading:",
        editorUrl
    );

    mainWindow.webContents.on(
        "did-fail-load",
        (
            _event,
            errorCode,
            errorDescription,
            validatedURL
        ) => {
            console.error(
                "Editor load failed:",
                errorCode,
                errorDescription,
                validatedURL
            );
        }
    );

    mainWindow.webContents.on(
        "will-navigate",
        (
            event,
            navigationUrl
        ) => {
            if (
                !navigationUrl.startsWith(
                    editorOrigin
                )
            ) {
                event.preventDefault();
            }
        }
    );

    mainWindow.loadURL(
        editorUrl
    ).catch(error => {
        console.error(
            "Unable to load editor URL:",
            error
        );
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    try {
        const editorOrigin =
            await startLocalServer();

        const editorSession =
            session.fromPartition(
                SESSION_PARTITION
            );

        configureUsbAccess(
            editorSession,
            editorOrigin
        );

        createMainWindow(
            editorOrigin
        );

        app.on("activate", () => {
            if (
                BrowserWindow
                    .getAllWindows()
                    .length === 0
            ) {
                createMainWindow(
                    editorOrigin
                );
            }
        });
    } catch (error) {
        console.error(
            "Unable to start XC_GUI MakeCode:",
            error
        );

        app.quit();
    }
});

app.on("before-quit", () => {
    if (localServer) {
        localServer.close();
        localServer = null;
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
```

Important points:

```text
The port remains fixed at 32145.
The session partition remains persist:xcgui-editor-http-v1.
The stable origin and partition preserve MakeCode projects.
The wrapper allows WebUSB only for the local XC_GUI editor.
The release version does not call openDevTools().
```

Check the JavaScript syntax:

```powershell
Set-Location $ElectronRoot

node --check ".\main.js"
```

No output means the syntax is valid.

---

## 25. Test the Electron wrapper during development

Run the project directly with the installed Electron runtime:

```powershell
Set-Location $ElectronRoot

& ".\node_modules\.bin\electron.cmd" .
```

The editor should open at the internally served address:

```text
http://127.0.0.1:32145/xcgui/index.html
```

Test all of the following before creating a portable release:

```text
The XC_GUI category appears.
A new Blocks project can be created.
The project compiles.
The HEX file can be downloaded.
The same HEX can be imported again.
The Blocks layout is restored.
Additional project files such as xcimages.ts are restored.
A project remains after closing and reopening the application.
The micro:bit V2 can be selected through WebUSB.
```

### Development logging

For temporary diagnostics:

```powershell
$env:ELECTRON_ENABLE_LOGGING = "1"

& ".\node_modules\.bin\electron.cmd" . `
    --enable-logging
```

Remove the environment variable afterwards:

```powershell
Remove-Item `
    Env:ELECTRON_ENABLE_LOGGING `
    -ErrorAction SilentlyContinue
```

Do not include this in the release version:

```javascript
mainWindow.webContents.openDevTools({
    mode: "detach"
});
```

That code opens the separate debug window every time the application starts.

---

## 26. Build the portable Electron application

Electron Forge was not used for the confirmed release because its package process
remained at:

```text
Preparing to package application
Copying files
```

The confirmed workflow copies the installed Electron runtime directly and places
the application under:

```text
resources\app
```

Run this complete PowerShell block:

```powershell
Set-Location $ElectronRoot

$ProjectFolder = (Get-Location).Path

$ElectronDist = (
    Resolve-Path `
        ".\node_modules\electron\dist"
).Path

$PortableFolder = Join-Path `
    $ProjectFolder `
    "portable\XC_GUI MakeCode"

$AppFolder = Join-Path `
    $PortableFolder `
    "resources\app"

Remove-Item `
    $PortableFolder `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

New-Item `
    -ItemType Directory `
    -Path $PortableFolder `
    -Force | Out-Null

Write-Host ""
Write-Host "Copying Electron runtime..."

robocopy `
    "$ElectronDist" `
    "$PortableFolder" `
    /E `
    /R:1 `
    /W:1 `
    /MT:16 `
    /NFL `
    /NDL `
    /NP

if ($LASTEXITCODE -ge 8) {
    throw "Copying Electron runtime failed. Robocopy code: $LASTEXITCODE"
}

Rename-Item `
    (Join-Path $PortableFolder "electron.exe") `
    "XC_GUI MakeCode.exe" `
    -Force

Remove-Item `
    $AppFolder `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Remove-Item `
    (Join-Path $PortableFolder "resources\app.asar") `
    -Force `
    -ErrorAction SilentlyContinue

New-Item `
    -ItemType Directory `
    -Path $AppFolder `
    -Force | Out-Null

Copy-Item `
    ".\main.js" `
    (Join-Path $AppFolder "main.js") `
    -Force

$RuntimePackage = @'
{
    "name": "xcgui-makecode",
    "productName": "XC_GUI MakeCode",
    "version": "0.1.0",
    "description": "XC_GUI MakeCode editor for micro:bit V2",
    "main": "main.js"
}
'@

[System.IO.File]::WriteAllText(
    (Join-Path $AppFolder "package.json"),
    $RuntimePackage,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "Copying MakeCode editor..."

robocopy `
    ".\editor" `
    (Join-Path $AppFolder "editor") `
    /E `
    /R:1 `
    /W:1 `
    /MT:16 `
    /NFL `
    /NDL `
    /NP

if ($LASTEXITCODE -ge 8) {
    throw "Copying MakeCode editor failed. Robocopy code: $LASTEXITCODE"
}

$EditorIndex = Join-Path `
    $AppFolder `
    "editor\xcgui\index.html"

if (-not (Test-Path $EditorIndex)) {
    throw "Editor entry file was not found: $EditorIndex"
}

Write-Host ""
Write-Host "Portable application created:"
Write-Host $PortableFolder
```

The resulting structure is:

```text
portable\
└── XC_GUI MakeCode\
    ├── XC_GUI MakeCode.exe
    ├── chrome_100_percent.pak
    ├── icudtl.dat
    ├── locales\
    └── resources\
        └── app\
            ├── package.json
            ├── main.js
            └── editor\
                └── xcgui\
                    └── index.html
```

Do not distribute only:

```text
XC_GUI MakeCode.exe
```

The complete folder is required because the executable depends on the Electron
runtime files, locale files, and the contents of `resources`.

---

## 27. Verify and run the portable application

Check the required files:

```powershell
Set-Location $ElectronRoot

Test-Path `
    ".\portable\XC_GUI MakeCode\XC_GUI MakeCode.exe"

Test-Path `
    ".\portable\XC_GUI MakeCode\resources\app\main.js"

Test-Path `
    ".\portable\XC_GUI MakeCode\resources\app\editor\xcgui\index.html"
```

All three commands should return:

```text
True
```

Run the application:

```powershell
& ".\portable\XC_GUI MakeCode\XC_GUI MakeCode.exe"
```

For temporary logging:

```powershell
$env:ELECTRON_ENABLE_LOGGING = "1"

& ".\portable\XC_GUI MakeCode\XC_GUI MakeCode.exe" `
    --enable-logging
```

Remove logging before the final user test:

```powershell
Remove-Item `
    Env:ELECTRON_ENABLE_LOGGING `
    -ErrorAction SilentlyContinue
```

For the final release test, launch the application by double-clicking:

```text
portable\XC_GUI MakeCode\XC_GUI MakeCode.exe
```

Only the editor window should appear.

---

## 28. Create a versioned ZIP release

Choose the release version:

```powershell
$Version = "0.1.0"
```

Create a release folder and ZIP:

```powershell
Set-Location $ElectronRoot

$PortableFolder = Join-Path `
    $ElectronRoot `
    "portable\XC_GUI MakeCode"

$ReleaseRoot = Join-Path `
    $ElectronRoot `
    "release"

$ReleaseName =
    "XC_GUI-MakeCode-$Version-win-x64"

$VersionedFolder = Join-Path `
    $ReleaseRoot `
    $ReleaseName

$ZipFile = Join-Path `
    $ReleaseRoot `
    "$ReleaseName.zip"

Remove-Item `
    $VersionedFolder `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Remove-Item `
    $ZipFile `
    -Force `
    -ErrorAction SilentlyContinue

New-Item `
    -ItemType Directory `
    -Path $ReleaseRoot `
    -Force | Out-Null

New-Item `
    -ItemType Directory `
    -Path $VersionedFolder `
    -Force | Out-Null

robocopy `
    "$PortableFolder" `
    "$VersionedFolder" `
    /E `
    /R:1 `
    /W:1 `
    /MT:16 `
    /NFL `
    /NDL `
    /NP

if ($LASTEXITCODE -ge 8) {
    throw "Unable to prepare the release folder. Robocopy code: $LASTEXITCODE"
}

Compress-Archive `
    -Path $VersionedFolder `
    -DestinationPath $ZipFile `
    -CompressionLevel Optimal

Get-Item $ZipFile |
    Select-Object FullName, Length, LastWriteTime
```

Generate a SHA-256 checksum:

```powershell
Get-FileHash `
    $ZipFile `
    -Algorithm SHA256 |
    Format-List
```

The distributable file is:

```text
xcgui-electron\release\XC_GUI-MakeCode-0.1.0-win-x64.zip
```

The user extracts the complete ZIP and launches:

```text
XC_GUI-MakeCode-0.1.0-win-x64\
└── XC_GUI MakeCode.exe
```

An unsigned executable may cause Windows to display a publisher or SmartScreen
warning. Code signing can be added later for a public commercial release.

---

## 29. Full Electron release update workflow

Use this sequence after changing the PXT target, XC_GUI extension, native CODAL
integration, images, or desktop wrapper.

### Step 1: rebuild the PXT target

```powershell
Set-Location $PxtRoot

$env:PXT_COMPILE_SWITCHES = "csv---mbcodal"
$env:PXT_FORCE_LOCAL = "1"

npx pxt clean
npx pxt buildtarget --local
```

### Step 2: build the static package

```powershell
npx pxt staticpkg `
    --route xcgui `
    --output ".\release\editor" `
    --minify
```

### Step 3: replace the Electron editor copy

```powershell
Remove-Item `
    "$ElectronRoot\editor" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

New-Item `
    -ItemType Directory `
    -Path "$ElectronRoot\editor" `
    -Force | Out-Null

robocopy `
    "$PxtRoot\release\editor" `
    "$ElectronRoot\editor" `
    /E `
    /R:1 `
    /W:1 `
    /MT:16 `
    /NFL `
    /NDL `
    /NP

if ($LASTEXITCODE -ge 8) {
    throw "Unable to update the Electron editor files. Robocopy code: $LASTEXITCODE"
}
```

### Step 4: test with Electron

```powershell
Set-Location $ElectronRoot

& ".\node_modules\.bin\electron.cmd" .
```

### Step 5: rebuild the portable folder

Run the complete portable-build block from Section 26.

### Step 6: test the portable application

```powershell
& ".\portable\XC_GUI MakeCode\XC_GUI MakeCode.exe"
```

### Step 7: create the versioned ZIP

Run the release block from Section 28.

---

## 30. XC_GUI example projects for users

The extension’s internal:

```text
libs\xcgui\test.ts
```

is used for extension development and testing. It is not automatically shown as
a user project when the XC_GUI extension is added.

For a user-openable example:

1. Create a normal MakeCode project.
2. Add the XC_GUI extension.
3. Copy the contents of `test.ts` into the project’s `main.ts`.
4. Add any project-specific image `.ts` files.
5. Compile the project.
6. Download the project as a `.hex` file.
7. Import the `.hex` back into a clean editor to verify that the project source
   and Blocks can be restored.

A MakeCode HEX can contain the embedded editable project, including:

```text
main.ts
main.blocks
pxt.json
additional project .ts files
```

The XC_GUI extension implementation itself is restored through the dependency
recorded in `pxt.json`.

Distribute tested examples next to the portable application:

```text
XC_GUI-MakeCode-0.1.0-win-x64\
├── XC_GUI MakeCode.exe
├── Examples\
│   ├── XC_GUI-Basic-Demo.hex
│   ├── XC_GUI-Image-Demo.hex
│   └── XC_GUI-Drawing-Demo.hex
└── resources\
```

Users can open an example through:

```text
Import → Import File → select the example HEX
```

Always import each release HEX into a clean editor before publishing it. Large
image buffers may make project-source embedding more difficult, so keeping the
original project source separately is also recommended.

---

## 31. Confirmed release checklist

Before publishing a ZIP release, confirm:

```text
[ ] The static editor opens through http://127.0.0.1:32145.
[ ] XC_GUI appears in the Toolbox.
[ ] A new project can be created.
[ ] Blocks and TypeScript compile without TS9200 errors.
[ ] The HEX file downloads.
[ ] The downloaded HEX imports back into the editor.
[ ] main.blocks is restored for a Blocks project.
[ ] Additional image .ts files are restored.
[ ] Projects remain after closing and reopening the application.
[ ] WebUSB detects the micro:bit V2.
[ ] XC_GUI hardware drawing and image tests work.
[ ] No DevTools window opens in the release.
[ ] No logging PowerShell window is required.
[ ] The complete portable folder is included in the ZIP.
[ ] The ZIP is tested after extracting it into a different folder.
[ ] The SHA-256 checksum is recorded.
```

The final end-user workflow is:

```text
Extract the ZIP
    ↓
Open XC_GUI MakeCode.exe
    ↓
Create or import a project
    ↓
Compile and download the HEX
    ↓
Flash the micro:bit V2
```
