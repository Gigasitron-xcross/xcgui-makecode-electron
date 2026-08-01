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

function sendText(
    response,
    statusCode,
    text
) {
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
        "console-message",
        (_event, details) => {
            console.log(
                `[Renderer ${details.level}]`,
                details.message
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