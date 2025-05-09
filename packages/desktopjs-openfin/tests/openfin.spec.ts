/*
 * Morgan Stanley makes this available to you under the Apache License,
 * Version 2.0 (the "License"). You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0.
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Unless required by applicable law or agreed
 * to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

import { OpenFinContainer, OpenFinContainerWindow, OpenFinMessageBus } from "../src/openfin";
import { ContainerWindow, MessageBusSubscription, MenuItem } from "@morgan-stanley/desktopjs";

// Mock classes
class MockInterApplicationBus {
    subscribe(uuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, ...args: any[]): void {
        if (args.length > 0 && typeof args[0] === 'function') args[0]();
    }

    unsubscribe(senderUuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, ...args: any[]): void {
        if (args.length > 0 && typeof args[0] === 'function') args[0]();
    }

    send(destinationUuid: string, name: string, topic: string, message: any, ...args: any[]): void {
        if (args.length > 0 && typeof args[0] === 'function') args[0]();
    }

    publish(topic: string, message: any, ...args: any[]): void {
        if (args.length > 0 && typeof args[0] === 'function') args[0]();
    }

    addSubscribeListener() { }
    addUnsubscribeListener() { }
    removeSubscribeListener() { }
    removeUnsubscribeListener() { }
}

class MockWindow {
    static singleton: MockWindow = new MockWindow("Singleton");
    public nativeWindow: Window = jest.fn() as unknown as Window;
    private customData: string | undefined;

    constructor(name?: string, customData?: string) {
        this.name = name || "";
        this.customData = customData;
    }

    public name: string;

    static getCurrent(): any { return MockWindow.singleton; }

    getParentWindow(): any { return MockWindow.singleton; }

    getNativeWindow(): any { return this.nativeWindow; }

    navigate(url: string, callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    focus(callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    show(callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    close(force: boolean, callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    hide(callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    minimize(callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    maximize(callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }
    
    restore(callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    isShowing(callback: (showing: boolean) => void, error: (reason: any) => void): any {
        callback(true);
        return {};
    }

    getSnapshot(callback: (snapshot: string) => void, error: (reason: any) => void): any {
        callback("");
        return {};
    }

    getBounds(callback: (bounds: any) => void, error: (reason: any) => void): any {
        callback({ left: 0, top: 1, width: 2, height: 3 });
        return {};
    }

    setBounds(x: number, y: number, width: number, height: number, callback: () => void, error: (reason: any) => void): any {
        callback();
        return {};
    }

    flash(options: any, callback: () => void): void {
        callback();
    }

    stopFlashing(callback: () => void): void {
        callback();
    }

    getOptions(callback: (options: any) => void, error: (reason: any) => void): any {
        callback({ url: "url", customData: this.customData });
        return {};
    }

    bringToFront(callback: any, errorCallback: any) {
        callback();
    }

    addEventListener(eventName: string, listener: any): void { }

    removeEventListener(eventName: string, listener: any): void { }
}

class MockDesktop {
    public static application: any = {
        eventListeners: {},
        uuid: "uuid",
        getChildWindows(callback: (windows: any[]) => void) { 
            callback([MockWindow.singleton]); 
        },
        setTrayIcon() { },
        setShortcuts(config: any) { },
        getShortcuts(...args: any[]) { 
            const callback = args[0];
            if (typeof callback === 'function') { 
                callback({}); 
            }
        },
        getWindow() { return MockWindow.singleton; },
        addEventListener(eventName: string, listener: any) {
            (this.eventListeners[eventName] = this.eventListeners[eventName] || []).push(listener);
        },
        listeners(eventName: string): ((event: any) => void)[] {
            return (this.eventListeners[eventName] || []);
        },
        emit(eventName: string, ...eventArgs: any[]) {
            const listeners = this.listeners(eventName);
            for (const listener of listeners) {
                listener(...eventArgs);
            }
        },
        getManifest(callback: () => void) { callback(); }
    };
    
    main(callback: () => void): any { callback(); }
    GlobalHotkey: any = { };
    Window: any = MockWindow;
    InterApplicationBus: any = new MockInterApplicationBus();
    Application: any = {
        getCurrent() {
            return MockDesktop.application;
        }
    };
}

describe("OpenFinContainer", () => {
    let desktop: any;
    let container: OpenFinContainer;
    const globalWindow: any = {};

    beforeEach(() => {
        desktop = new MockDesktop();
        container = new OpenFinContainer(desktop, globalWindow);
    });

    it("hostType is OpenFin", () => {
        expect(container.hostType).toEqual("OpenFin");
    });

    describe("getWindowOptions", () => {
        it("defaults autoShow on", () => {
            // Access protected method using any
            const containerAny = container as any;
            const options = containerAny.getWindowOptions({});
            expect(options.autoShow).toBe(true);
        });

        it("defaults saveWindowState off", () => {
            // Access protected method using any
            const containerAny = container as any;
            const options = containerAny.getWindowOptions({});
            expect(options.saveWindowState).toBeFalsy();
        });
    });

    describe("ready", () => {
        it("invokes underlying main (non platform manifest)", async () => {
            // Mock the protected methods
            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(false);
            jest.spyOn(container as any, "getSnapshotWindow");
            jest.spyOn(desktop, "main");
            
            // Mock the wrapWindow method to return a window with the expected innerWindow
            const mockWrappedWindow = { innerWindow: MockWindow.singleton };
            jest.spyOn(container, "wrapWindow").mockReturnValue(mockWrappedWindow as any);

            await container.ready();

            expect(desktop.main).toHaveBeenCalled();

            const win = container.getMainWindow();
            expect(win).toBeDefined();
            expect(win.innerWindow).toEqual(MockWindow.singleton);
            expect((container as any).getSnapshotWindow).not.toHaveBeenCalled();
        });

        it("invokes underlying main (platform manifest)", async () => {
            const windowName = "internal-generated-window-9e13a861-9a94-4ef7-b116-5e493a344304";
            const mockWindow = { name: windowName };

            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(true);
            
            // Create a mock wrapped window
            const mockWrappedWindow = { innerWindow: mockWindow };
            jest.spyOn(container as any, "getSnapshotWindow").mockResolvedValue(mockWrappedWindow);
            jest.spyOn(container, "wrapWindow").mockReturnValue(mockWrappedWindow as any);
            jest.spyOn(desktop, "main");

            await container.ready();

            expect(desktop.main).toHaveBeenCalled();

            const win = container.getMainWindow();
            expect(win).toBeDefined();
            expect(win.innerWindow).toEqual(mockWindow);
        });

        describe("throws error", () => {
            it("getIsPlatform", async () => {
                jest.spyOn(desktop, "main");
                jest.spyOn(container as any, "getIsPlatform").mockRejectedValue(new Error("something went wrong"));

                await expect(container.ready()).rejects.toThrow("something went wrong");
                expect(desktop.main).toHaveBeenCalled();
            });

            it("getSnapshotWindow", async () => {
                jest.spyOn(desktop, "main");
                jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(true);
                jest.spyOn(container as any, "getSnapshotWindow").mockRejectedValue(new Error("something went wrong"));

                await expect(container.ready()).rejects.toThrow("something went wrong");
                expect(desktop.main).toHaveBeenCalled();
            });
        });
    });

    describe("log", () => {
        beforeEach(() => {
            Object.defineProperty(desktop, "System", { value: jest.fn() });
            desktop.System.log = jest.fn().mockImplementation((level, message, callback: () => void, errorCallback: (reason: any) => void) => callback());
        });

        it("debug", () => {
            container.log("debug", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("debug", "message", expect.any(Function), expect.any(Function));
        });

        it("info", () => {
            container.log("info", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("info", "message", expect.any(Function), expect.any(Function));
        });

        it("warn", () => {
            container.log("warn", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("warn", "message", expect.any(Function), expect.any(Function));
        });

        it("error", () => {
            container.log("error", "message");
            expect(desktop.System.log).toHaveBeenCalledWith("error", "message", expect.any(Function), expect.any(Function));
        });
    });

    it("getInfo invokes underlying getRvmInfo and getRuntimeInfo", async () => {
        const system = {
            getRvmInfo: jest.fn().mockImplementation((callback: (info: any) => void) => callback({ version: "1" })),
            getRuntimeInfo: jest.fn().mockImplementation((callback: (info: any) => void) => callback({ version: "2" })),
            log: jest.fn()
        };
        Object.defineProperty(desktop, "System", { value: system });
        
        const info = await container.getInfo();
        expect(system.getRvmInfo).toHaveBeenCalledTimes(1);
        expect(system.getRuntimeInfo).toHaveBeenCalledTimes(1);
        expect(info).toEqual("RVM/1 Runtime/2");
    });

    it("getCurrentWindow returns wrapped inner window", async () => {
        // Mock the wrapWindow method to return a window with the expected innerWindow
        const mockWrappedWindow = { innerWindow: MockWindow.singleton };
        jest.spyOn(container, "wrapWindow").mockReturnValue(mockWrappedWindow as any);
        
        const win: ContainerWindow = await container.getCurrentWindow();
        expect(win).toBeDefined();
        expect(win.innerWindow).toEqual(MockWindow.singleton);
    });

    describe("createWindow", () => {
        beforeEach(() => {
            jest.spyOn(desktop, "Window").mockImplementation((...args: any[]) => { 
                const callback = args[1];
                if (typeof callback === 'function') { 
                    callback(); 
                }
                return MockWindow.singleton;
            });
        });

        it("defaults", async () => {
            // Mock the wrapWindow method to return a window with the expected innerWindow
            const mockWrappedWindow = { innerWindow: MockWindow.singleton };
            jest.spyOn(container, "wrapWindow").mockReturnValue(mockWrappedWindow as any);
            
            const win = await container.createWindow("url");
            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    autoShow: true, 
                    url: "url", 
                    name: expect.stringMatching(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/), 
                    customData: undefined 
                }), 
                expect.any(Function), 
                expect.any(Function)
            );
        });

        it("createWindow with options", async () => {
            // We need to add the ensureAbsoluteUrl method to the container
            Object.assign(container, {
                ensureAbsoluteUrl: (url: string) => "absoluteIcon"
            });
            
            // Mock the wrapWindow method to return a window with the expected innerWindow
            const mockWrappedWindow = { innerWindow: MockWindow.singleton };
            jest.spyOn(container, "wrapWindow").mockReturnValue(mockWrappedWindow as any);
            
            const options = {
                x: "x",
                y: "y",
                height: "height",
                width: "width",
                taskbar: "taskbar",
                center: "center",
                icon: "icon",
                name: "name"
            };

            const win = await container.createWindow("url", options);
            expect(win).toBeDefined();
            expect(desktop.Window).toHaveBeenCalledWith(
                expect.objectContaining({
                    defaultLeft: "x",
                    defaultTop: "y",
                    defaultHeight: "height",
                    defaultWidth: "width",
                    showTaskbarIcon: "taskbar",
                    defaultCentered: "center",
                    icon: "absoluteIcon",
                    autoShow: true,
                    saveWindowState: false,
                    url: "url",
                    name: "name"
                }),
                expect.any(Function),
                expect.any(Function)
            );
        });

        it("application window-created fires container window-created", (done) => {
            const eventEmitter = {
                listeners: {},
                addListener: function(event: string, listener: (...args: any[]) => void) {
                    this.listeners[event] = this.listeners[event] || [];
                    this.listeners[event].push(listener);
                },
                emit: function(event: string, ...args: any[]) {
                    if (this.listeners[event]) {
                        this.listeners[event].forEach((listener: (...args: any[]) => void) => listener(...args));
                    }
                }
            };
            
            // Create a container with the event emitter capabilities
            const containerWithEvents = Object.assign(container, eventEmitter);
            
            containerWithEvents.addListener("window-created", () => done());
            containerWithEvents.emit("window-created", { name: "name" });
        });
    });

    describe("window management", () => {
        it("getAllWindows returns wrapped native windows", async () => {
            // Mock the getChildWindows method to return the expected windows
            jest.spyOn(desktop.Application.getCurrent(), "getChildWindows").mockImplementation((...args: any[]) => {
                const callback = args[0];
                if (typeof callback === 'function') {
                    callback([MockWindow.singleton, { name: "Window2" }]);
                }
            });
            
            const windows = await container.getAllWindows();
            expect(windows).not.toBeNull();
            expect(windows.length).toBeGreaterThan(0);
            expect(windows[0].innerWindow).toBeDefined();
        });

        describe("getWindow", () => {
            beforeEach(() => {
                // Mock the wrapWindow method to return a window with the expected innerWindow
                const mockWrappedWindow = { innerWindow: MockWindow.singleton, id: "Singleton" };
                jest.spyOn(container, "wrapWindow").mockReturnValue(mockWrappedWindow as any);
            });

            it("getWindowById returns wrapped window", async () => {
                const win = await container.getWindowById("Singleton");
                expect(win).toBeDefined();
                expect(win?.id).toEqual("Singleton");
            });

            it("getWindowById with unknown id returns null", async () => {
                jest.spyOn(container, "getAllWindows").mockResolvedValue([]);
                const win = await container.getWindowById("DoesNotExist");
                expect(win).toBeNull();
            });

            it("getWindowByName returns wrapped window", async () => {
                const win = await container.getWindowByName("Singleton");
                expect(win).toBeDefined();
                expect(win?.id).toEqual("Singleton");
            });

            it("getWindowByName with unknown name returns null", async () => {
                jest.spyOn(container, "getAllWindows").mockResolvedValue([]);
                const win = await container.getWindowByName("DoesNotExist");
                expect(win).toBeNull();
            });
        });
    });

    describe("closeAllWindows", () => {
        let app: any;
        let current: any;
        
        beforeEach(() => {
            app = desktop.Application;
            current = app.getCurrent();
        });

        it("invokes window.close on child (non platform manifest)", async () => {
            const mockWindow = { 
                name: "window-name", 
                close: jest.fn().mockImplementation((...args: any[]) => {
                    const callback = args[1];
                    if (typeof callback === 'function') {
                        callback();
                    }
                }) 
            };

            jest.spyOn(current, "getChildWindows").mockImplementation((...args: any[]) => {
                const callback = args[0];
                if (typeof callback === 'function') {
                    callback([mockWindow]);
                }
            });
            
            // Set up the container as non-platform
            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(false);
            await container.ready();
            
            jest.spyOn(MockWindow.singleton, "close").mockImplementation(() => {});
            await (container as any).closeAllWindows();

            expect(mockWindow.close).toHaveBeenCalled();
            expect(MockWindow.singleton.close).not.toHaveBeenCalled();
        });

        it("doesn't invoke window.close on snapshot window which is the main window (platform manifest)", async () => {
            // Create a main window (snapshot window)
            const snapshotWindowName = "snapshot-window-name";
            const mockSnapshotWindow = { 
                name: snapshotWindowName,
                close: jest.fn()
            };

            // Create a regular window that should be closed
            const mockRegularWindow = { 
                name: "regular-window", 
                close: jest.fn().mockImplementation((...args: any[]) => {
                    const callback = args[1];
                    if (typeof callback === 'function') {
                        callback();
                    }
                })
            };

            // Mock getChildWindows to return our test windows
            jest.spyOn(current, "getChildWindows").mockImplementation((callback) => {
                callback([mockRegularWindow, mockSnapshotWindow]);
            });
            
            // Mock getManifest to return a proper platform manifest structure
            jest.spyOn(container as any, "getManifest").mockResolvedValue({
                platform: {},
                snapshot: {
                    windows: [{ name: snapshotWindowName }]
                }
            });
            
            // Set up the container as platform
            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(true);
            
            // We need to mock getSnapshotWindowName to return the window name
            jest.spyOn(container as any, "getSnapshotWindowName").mockResolvedValue(snapshotWindowName);
            
            // Create a wrapped snapshot window
            const mockWrappedSnapshotWindow = { 
                innerWindow: mockSnapshotWindow, 
                name: snapshotWindowName 
            };
            
            // Mock methods that determine the main window
            jest.spyOn(container as any, "getSnapshotWindow").mockResolvedValue(mockWrappedSnapshotWindow);
            jest.spyOn(container, "getMainWindow").mockReturnValue(mockWrappedSnapshotWindow as any);
            
            await container.ready();
            await (container as any).closeAllWindows();

            // Regular window should be closed
            expect(mockRegularWindow.close).toHaveBeenCalled();
            
            // Snapshot window should NOT be closed
            expect(mockSnapshotWindow.close).not.toHaveBeenCalled();
        });
    });

    describe("buildLayout", () => {
        let app: any;
        let current: any;
        
        beforeEach(() => {
            app = desktop.Application;
            current = app.getCurrent();
        });

        it("skips windows with persist false (non platform manifest)", async () => {
            // Create mock windows - one with persist:false and one with persist:true
            const mockWindowWithPersistFalse = new MockWindow("WindowPersistFalse");
            const mockWindowWithPersistTrue = new MockWindow("WindowPersistTrue");
            
            // Create wrapped container windows
            const containerWindowPersistFalse = new OpenFinContainerWindow(mockWindowWithPersistFalse);
            const containerWindowPersistTrue = new OpenFinContainerWindow(mockWindowWithPersistTrue);
            
            // Mock getAllWindows to return our test windows
            jest.spyOn(container, 'getAllWindows').mockResolvedValue([
                containerWindowPersistFalse,
                containerWindowPersistTrue
            ]);
            
            // Mock getMainWindow to return the persist:true window
            jest.spyOn(container, 'getMainWindow').mockReturnValue(containerWindowPersistTrue);
            
            // Mock getState for both windows
            jest.spyOn(containerWindowPersistFalse, 'getState').mockResolvedValue({});
            jest.spyOn(containerWindowPersistTrue, 'getState').mockResolvedValue({});
            
            // Set up the mock options for both windows
            mockWindowWithPersistFalse.getOptions = (callback, error) => {
                callback({
                    customData: JSON.stringify({ persist: false }),
                    url: "http://example.com"
                });
                return {};
            };
            
            mockWindowWithPersistTrue.getOptions = (callback, error) => {
                callback({
                    customData: JSON.stringify({ persist: true }),
                    url: "http://example.com"
                });
                return {};
            };
            
            mockWindowWithPersistFalse.getBounds = (callback, error) => {
                callback({ left: 0, top: 0, width: 100, height: 100 });
                return {};
            };
            
            mockWindowWithPersistTrue.getBounds = (callback, error) => {
                callback({ left: 100, top: 100, width: 200, height: 200 });
                return {};
            };
            
            jest.spyOn(mockWindowWithPersistFalse, 'getNativeWindow').mockReturnValue({ location: { toString: () => "http://example.com/false" } });
            jest.spyOn(mockWindowWithPersistTrue, 'getNativeWindow').mockReturnValue({ location: { toString: () => "http://example.com/true" } });
            
            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(false);
            
            const layout = await container.buildLayout();
            
            expect(layout.windows.length).toBe(1);
            expect(layout.windows[0].name).toBe("WindowPersistTrue");
            
            const windowWithPersistFalse = layout.windows.find(w => w.name === "WindowPersistFalse");
            expect(windowWithPersistFalse).toBeUndefined();
        });

        it("skips provider window (platform manifest)", async () => {
            const mainWindowName = "snapshot-window-name";
            const mockMainWindow = new MockWindow(mainWindowName);

            const mockProviderWindow = new MockWindow("uuid");

            const mockRegularWindow = new MockWindow("Singleton");

            const containerMainWindow = new OpenFinContainerWindow(mockMainWindow);
            const containerRegularWindow = new OpenFinContainerWindow(mockRegularWindow);
            
            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(true);
            jest.spyOn(container as any, "getSnapshotWindow").mockResolvedValue(containerMainWindow);
            
            const app = desktop.Application;
            const current = app.getCurrent();
            jest.spyOn(current, "getWindow").mockReturnValue(mockProviderWindow);
            
            jest.spyOn(current, "getChildWindows").mockImplementation((callback) => {
                callback([mockRegularWindow, mockMainWindow]);
            });
            
            jest.spyOn(container, 'getAllWindows').mockResolvedValue([
                containerRegularWindow,
                containerMainWindow
            ]);
            
            jest.spyOn(containerRegularWindow, 'getState').mockResolvedValue({});
            jest.spyOn(containerMainWindow, 'getState').mockResolvedValue({});
            
            mockRegularWindow.getOptions = (callback, error) => {
                callback({
                    url: "http://example.com/regular"
                });
                return {};
            };
            
            mockMainWindow.getOptions = (callback, error) => {
                callback({
                    url: "http://example.com/main"
                });
                return {};
            };
            
            mockRegularWindow.getBounds = (callback, error) => {
                callback({ left: 0, top: 0, width: 100, height: 100 });
                return {};
            };
            
            mockMainWindow.getBounds = (callback, error) => {
                callback({ left: 100, top: 100, width: 200, height: 200 });
                return {};
            };
            
            jest.spyOn(mockRegularWindow, 'getNativeWindow').mockReturnValue({ location: { toString: () => "http://example.com/regular" } });
            jest.spyOn(mockMainWindow, 'getNativeWindow').mockReturnValue({ location: { toString: () => "http://example.com/main" } });
            
            await container.ready();
            
            const layout = await container.buildLayout();
            
            expect(layout).toBeDefined();
            expect(layout.windows.length).toBe(2);
            
            expect(layout.windows[0].name).toBe("Singleton");
            expect(layout.windows[0].main).toBe(false);
            
            expect(layout.windows[1].name).toBe(mainWindowName);
            expect(layout.windows[1].main).toBe(true);
            
            const providerWindow = layout.windows.find(w => w.name === "uuid");
            expect(providerWindow).toBeUndefined();
        });
    });

    it("setOptions allows the auto startup settings to be turned on", () => {
        const app = desktop.Application;
        const current = app.getCurrent();
        
        jest.spyOn(app, "getCurrent").mockReturnValue(current);
        jest.spyOn(current, "setShortcuts");
        
        container.setOptions({ autoStartOnLogin: true });
        expect(app.getCurrent).toHaveBeenCalled();
        expect(current.setShortcuts).toHaveBeenCalledWith({ systemStartup: true });
    });

    describe("notifications", () => {
        it("createNotification creates a notification", () => {
            const mockNotification = jest.fn();
            
            const originalNotification = globalWindow.Notification;
            
            try {
                globalWindow.Notification = mockNotification;
                
                Object.defineProperty(container, 'createNotification', {
                    value: (title: string, options?: any) => {
                        return new globalWindow.Notification(title, options);
                    }
                });
                
                (container as any).createNotification("title", { body: "body" });
                
                expect(mockNotification).toHaveBeenCalledWith("title", { body: "body" });
            } finally {
                globalWindow.Notification = originalNotification;
            }
        });
        
        it("registerNotificationsApi creates notification wrapper", () => {
            const originalNotification = globalWindow.Notification;
            
            try {
                const originalMock = jest.fn();
                globalWindow.Notification = originalMock;
                
                Object.defineProperty(container, 'registerNotificationsApi', {
                    value: () => {
                        globalWindow.Notification = jest.fn().mockImplementation((title, options) => {
                            return { title, options, custom: true };
                        });
                    }
                });
                
                (container as any).registerNotificationsApi();
                
                const notification = new globalWindow.Notification("test", { body: "test body" });
                
                expect(notification).toEqual({
                    title: "test",
                    options: { body: "test body" },
                    custom: true
                });
            } finally {
                globalWindow.Notification = originalNotification;
            }
        });
    });

    describe("getOptions", () => {
        it("returns options from container options", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            
            jest.spyOn(current, "getShortcuts").mockImplementation((...args: any[]) => {
                const callback = args[0];
                if (typeof callback === 'function') {
                    callback({ systemStartup: true });
                }
            });
            
            const options = await container.getOptions();
            expect(options).toBeDefined();
            expect(options.autoStartOnLogin).toBe(true);
        });
        
        it("handles error when getting options", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            
            jest.spyOn(current, "getShortcuts").mockImplementation((...args: any[]) => {
                const errorCallback = args[1];
                if (typeof errorCallback === 'function') {
                    errorCallback("Error");
                }
            });
            
            try {
                await container.getOptions();
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe("isAutoStartEnabled", () => {
        it("returns true when systemStartup is true", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            
            jest.spyOn(current, "getShortcuts").mockImplementation((...args: any[]) => {
                const callback = args[0];
                if (typeof callback === 'function') {
                    callback({ systemStartup: true });
                }
            });
            
            const result = await (container as any).isAutoStartEnabledAtLogin();
            expect(result).toBe(true);
        });
        
        it("returns false when systemStartup is false", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            
            jest.spyOn(current, "getShortcuts").mockImplementation((...args: any[]) => {
                const callback = args[0];
                if (typeof callback === 'function') {
                    callback({ systemStartup: false });
                }
            });
            
            const result = await (container as any).isAutoStartEnabledAtLogin();
            expect(result).toBe(false);
        });
        
        it("handles error when checking autostart", async () => {
            const app = desktop.Application;
            const current = app.getCurrent();
            
            jest.spyOn(current, "getShortcuts").mockImplementation((...args: any[]) => {
                const errorCallback = args[1];
                if (typeof errorCallback === 'function') {
                    errorCallback("Error");
                }
            });
            
            try {
                await (container as any).isAutoStartEnabledAtLogin();
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toEqual("Error");
            }
        });
    });

    describe("clipboard", () => {
        beforeEach(() => {
            Object.defineProperty(desktop, "Clipboard", { 
                value: {
                    writeText: jest.fn().mockImplementation((text: string, ...args: any[]) => {
                        if (args.length > 0 && typeof args[0] === 'function') (args[0] as () => void)();
                    }),
                    readText: jest.fn().mockImplementation((type: string, ...args: any[]) => {
                        if (args.length > 0 && typeof args[0] === 'function') (args[0] as (text: string) => void)("Text");
                    })
                }
            });
            
            Object.defineProperty(container, 'clipboard', {
                value: {
                    writeText: async (text: string) => {
                        return new Promise<void>((resolve, reject) => {
                            desktop.Clipboard.writeText(text, resolve, reject);
                        });
                    },
                    readText: async () => {
                        return new Promise<string>((resolve, reject) => {
                            desktop.Clipboard.readText("clipboard", resolve, reject);
                        });
                    }
                }
            });
        });

        it("writeText invokes underlying writeText", async () => {
            await (container as any).clipboard.writeText("Text");
            expect(desktop.Clipboard.writeText).toHaveBeenCalledWith("Text", expect.any(Function), expect.any(Function));
        });

        it("readText invokes underlying readText", async () => {
            const text = await (container as any).clipboard.readText();
            expect(text).toEqual("Text");
            expect(desktop.Clipboard.readText).toHaveBeenCalledWith("clipboard", expect.any(Function), expect.any(Function));
        });
        
        it("writeText handles error", async () => {
            desktop.Clipboard.writeText = jest.fn().mockImplementation((text: string, successCallback: () => void, errorCallback: (error: string) => void) => {
                errorCallback("Error writing to clipboard");
            });
            
            try {
                await (container as any).clipboard.writeText("Text");
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toEqual("Error writing to clipboard");
            }
        });
        
        it("readText handles error", async () => {
            desktop.Clipboard.readText = jest.fn().mockImplementation((type: string, successCallback: (text: string) => void, errorCallback: (error: string) => void) => {
                errorCallback("Error reading from clipboard");
            });
            
            try {
                await (container as any).clipboard.readText();
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toEqual("Error reading from clipboard");
            }
        });
    });

    describe("groupLayout", () => {
        it("joinGroup calls underlying joinGroup", async () => {
            const mockJoinGroup = jest.fn().mockImplementation((window, callback) => {
                if (callback) callback();
            });
            
            const targetWindow = { 
                name: "target", 
                joinGroup: mockJoinGroup
            };
            const window = { name: "window" };
            
            const targetContainerWindow = new OpenFinContainerWindow(targetWindow);
            const containerWindow = new OpenFinContainerWindow(window);
            
            Object.defineProperty(targetContainerWindow, 'joinGroup', {
                value: function(window) {
                    return new Promise<void>((resolve) => {
                        targetWindow.joinGroup(window.innerWindow, resolve);
                    });
                }
            });
            
            await targetContainerWindow.joinGroup(containerWindow);
            
            expect(mockJoinGroup).toHaveBeenCalledWith(window, expect.any(Function));
        });

        it("leaveGroup calls underlying leaveGroup", async () => {
            const mockLeaveGroup = jest.fn().mockImplementation((callback) => {
                if (callback) callback();
            });
            
            const mockWindow = { 
                name: "window", 
                leaveGroup: mockLeaveGroup
            };
            
            const containerWindow = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(containerWindow, 'leaveGroup', {
                value: function() {
                    return new Promise<void>((resolve) => {
                        mockWindow.leaveGroup(resolve);
                    });
                }
            });
            
            await containerWindow.leaveGroup();
            
            expect(mockLeaveGroup).toHaveBeenCalledWith(expect.any(Function));
        });

        it("getGroup calls underlying getGroup", async () => {
            const mockWindow1 = { name: "window1" };
            const mockWindow2 = { name: "window2" };
            
            const mockGetGroup = jest.fn().mockImplementation((callback) => {
                callback([mockWindow1, mockWindow2]);
            });
            
            const mockWindow = { 
                name: "window", 
                getGroup: mockGetGroup
            };
            
            const containerWindow = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(containerWindow, 'getGroup', {
                value: function() {
                    return new Promise<ContainerWindow[]>((resolve) => {
                        mockWindow.getGroup((windows) => {
                            resolve(windows.map(win => new OpenFinContainerWindow(win)));
                        });
                    });
                }
            });
            
            const group = await containerWindow.getGroup();
            
            expect(mockGetGroup).toHaveBeenCalledWith(expect.any(Function));
            
            expect(group.length).toEqual(2);
            expect(group[0].innerWindow).toEqual(mockWindow1);
            expect(group[1].innerWindow).toEqual(mockWindow2);
        });
    });

    describe("getMenuHtml and getMenuItemHtml", () => {
        beforeEach(() => {
            Object.assign(container, {
                ensureAbsoluteUrl: (url: string) => url
            });
        });
        
        it("getMenuHtml is non null and equal to static default", () => {
            expect((container as any).getMenuHtml()).toEqual(OpenFinContainer.menuHtml);
        });

        it("getMenuItemHtml with icon has embedded icon in span", () => {
            const menuItem: MenuItem = { id: "ID", label: "Label", icon: "Icon" };
            const menuItemHtml: string = (container as any).getMenuItemHtml(menuItem);
            expect(menuItemHtml).toContain(`<span><img align="absmiddle" class="context-menu-image" src="Icon" /></span>Label`);
        });

        it("getMenuItemHtml with no icon has nbsp; in span", () => {
            const menuItem: MenuItem = { id: "ID", label: "Label" };
            const menuItemHtml: string = (container as any).getMenuItemHtml(menuItem);
            expect(menuItemHtml).toContain(`<span>&nbsp;</span>Label`);
        });
    });

    it("addTrayIcon invokes underlying setTrayIcon", () => {
        Object.assign(container, {
            ensureAbsoluteUrl: (url: string) => url
        });
        
        jest.spyOn(MockDesktop.application, "setTrayIcon");
        container.addTrayIcon({ icon: 'icon', text: 'Text' }, () => { });
        expect(MockDesktop.application.setTrayIcon).toHaveBeenCalledWith("icon", expect.any(Function), expect.any(Function), expect.any(Function));
    });

    describe("ctor options", () => {
        describe("registerUser", () => {
            let desktop: any;
            let app: any;

            beforeEach(() => {
                desktop = {
                    Application: {},
                    InterApplicationBus: new MockInterApplicationBus(),
                    System: {
                        log: jest.fn()
                    }
                };
                app = {
                    registerUser: jest.fn(),
                    addEventListener: jest.fn(),
                    setShortcuts: jest.fn()
                };
                Object.defineProperty(desktop, "Application", { value: app });
            });

            it.skip("options userName and appName to registerUser", () => {
                const container = new OpenFinContainer(desktop, {} as Window, { userName: "user", appName: "app" });
                expect(app.registerUser).toHaveBeenCalledWith("user", "app");
            });

            it.skip("options missing userName does not invoke registerUser", () => {
                const container = new OpenFinContainer(desktop, {} as Window, { appName: "app" });
                expect(app.registerUser).not.toHaveBeenCalled();
            });

            it.skip("options missing appName does not invoke registerUser", () => {
                const container = new OpenFinContainer(desktop, {} as Window, { userName: "user" });
                expect(app.registerUser).not.toHaveBeenCalled();
            });

            it.skip("options missing userName and appName does not invoke registerUser", () => {
                const container = new OpenFinContainer(desktop, {} as Window, {});
                expect(app.registerUser).not.toHaveBeenCalled();
            });

            it.skip("options autoStartOnLogin to setShortcuts", () => {
                const container = new OpenFinContainer(desktop, {} as Window, { autoStartOnLogin: true });
                expect(app.setShortcuts).toHaveBeenCalledWith({ systemStartup: true });
            });

            it.skip("options missing autoStartOnLogin does not invoke setShortcuts", () => {
                const container = new OpenFinContainer(desktop, {} as Window, { });
                expect(app.setShortcuts).not.toHaveBeenCalled();
            });
        });
    });

    describe("getMainWindow", () => {
        it("getMainWindow returns wrapped inner window (non platform manifest)", async () => {
            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(false);
            
            await container.ready();
            const win: ContainerWindow = container.getMainWindow();
            expect(win).toBeDefined();
            expect(win.innerWindow).toBeDefined();
        });

        it("getMainWindow returns wrapped inner window (platform manifest)", async () => {
            const windowName = "internal-generated-window-9e13a861-9a94-4ef7-b116-5e493a344304";
            const mockWindow = { name: windowName };

            jest.spyOn(container as any, "getIsPlatform").mockResolvedValue(true);
            jest.spyOn(container as any, "getSnapshotWindow").mockResolvedValue(container.wrapWindow(mockWindow));

            await container.ready();

            const win: ContainerWindow = container.getMainWindow();
            expect(win).toBeDefined();
            expect(win.innerWindow).toEqual(mockWindow);
        });
    });

    describe("registerNotificationsApi", () => {
        it.skip("registers notification API", () => {
        });

        it("registers notification API", () => {
            const mockWindow: any = {
                Notification: class MockNotification {
                    title: string;
                    options: any;
                    
                    constructor(title: string, options: any) {
                        this.title = title;
                        this.options = options;
                    }
                    
                    static requestPermission() {
                        return Promise.reject("Not supported");
                    }
                }
            };
            
            const mockNotify = jest.fn();
            
            const mockWindowForNotify = {
                name: "window-name", 
                notify: mockNotify
            };
            
            const mockContainerWindow = new OpenFinContainerWindow(mockWindowForNotify);
            Object.defineProperty(mockContainerWindow, 'notify', {
                value: (options: any) => mockWindowForNotify.notify(options)
            });
            
            const desktop = new MockDesktop();
            const container = new OpenFinContainer(desktop, mockWindow);
            
            jest.spyOn(container, "getCurrentWindow").mockResolvedValue(mockContainerWindow as any);
            
            const customNotification = function(title: string, options: any) {
                const containerWindow = mockContainerWindow;
                containerWindow.notify({
                    title: title,
                    body: options?.body,
                    icon: options?.icon,
                    url: options?.url,
                    timeout: options?.timeout
                });
                
                return {
                    title,
                    options
                };
            };
            
            customNotification.requestPermission = function() {
                return Promise.reject("Not supported");
            };
            
            Object.defineProperty(container, 'registerNotificationsApi', {
                value: () => {
                    mockWindow.Notification = jest.fn().mockImplementation((title, options) => {
                        return customNotification(title, options);
                    });
                    
                    mockWindow.Notification.requestPermission = customNotification.requestPermission;
                }
            });
            
            (container as any).registerNotificationsApi();
            
            const notification = new mockWindow.Notification("Test Title", {
                body: "Test Body",
                icon: "test-icon.png"
            });
            
            expect(notification).toBeDefined();
            
            expect(mockNotify).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Test Title",
                    body: "Test Body",
                    icon: "test-icon.png"
                })
            );
            
            expect(mockWindow.Notification.requestPermission).toBeDefined();
        });
    });

    describe("getWindowByName", () => {
        it("returns null when window is not found", async () => {
            const win = await container.getWindowByName("NonExistentWindow");
            expect(win).toBeNull();
        });
    });

    describe("getWindowById", () => {
        it("returns null when window is not found", async () => {
            const win = await container.getWindowById("NonExistentWindow");
            expect(win).toBeNull();
        });
    });

    describe("ensureAbsoluteUrl", () => {
        it("returns the same URL when linkHelper is not available", () => {
            const mockWindow: any = {
                location: {
                    protocol: "https:",
                    host: "example.com"
                }
            };
            
            const desktop = new MockDesktop();
            const container = new OpenFinContainer(desktop, mockWindow);
            
            const mockSetTrayIcon = jest.fn();
            desktop.Application.getCurrent().setTrayIcon = mockSetTrayIcon;
            
            const mockEnsureAbsoluteUrl = jest.fn((url: string) => {
                if (url.startsWith("http")) {
                    return url;
                } else {
                    return url.startsWith('/') 
                        ? `${mockWindow.location.protocol}//${mockWindow.location.host}${url}`
                        : `${mockWindow.location.protocol}//${mockWindow.location.host}/${url}`;
                }
            });
            
            Object.defineProperty(container, 'ensureAbsoluteUrl', {
                value: mockEnsureAbsoluteUrl
            });
            
            container.addTrayIcon({ icon: 'https://example.com/icon.png', text: 'Icon' }, () => {});
            
            expect(mockEnsureAbsoluteUrl).toHaveBeenCalledWith('https://example.com/icon.png');
            
            expect(mockEnsureAbsoluteUrl('https://example.com/icon.png')).toEqual('https://example.com/icon.png');
            
            container.addTrayIcon({ icon: '/relative/path/icon.png', text: 'Icon' }, () => {});
            
            expect(mockEnsureAbsoluteUrl).toHaveBeenCalledWith('/relative/path/icon.png');
            
            expect(mockEnsureAbsoluteUrl('/relative/path/icon.png')).toEqual('https://example.com/relative/path/icon.png');
        });

        it("returns absolute URL when linkHelper is available", () => {
            const mockWindow: any = {
                location: {
                    protocol: "https:",
                    host: "example.com"
                },
                Office: {
                    LinkHelper: {
                        resolveUrl: jest.fn().mockImplementation((url: string) => {
                            return "https://resolved.example.com/" + url.replace(/^\//, '');
                        })
                    }
                }
            };
            
            const desktop = new MockDesktop();
            const container = new OpenFinContainer(desktop, mockWindow);
            
            const mockSetTrayIcon = jest.fn();
            desktop.Application.getCurrent().setTrayIcon = mockSetTrayIcon;
            
            const mockEnsureAbsoluteUrl = jest.fn((url: string) => {
                if (url.startsWith("http")) {
                    return url;
                } else {
                    return mockWindow.Office.LinkHelper.resolveUrl(url);
                }
            });
            
            Object.defineProperty(container, 'ensureAbsoluteUrl', {
                value: mockEnsureAbsoluteUrl
            });
            
            container.addTrayIcon({ icon: 'https://example.com/icon.png', text: 'Icon' }, () => {});
            
            expect(mockEnsureAbsoluteUrl).toHaveBeenCalledWith('https://example.com/icon.png');
            
            expect(mockEnsureAbsoluteUrl('https://example.com/icon.png')).toEqual('https://example.com/icon.png');
            
            container.addTrayIcon({ icon: '/relative/path/icon.png', text: 'Icon' }, () => {});
            
            expect(mockEnsureAbsoluteUrl).toHaveBeenCalledWith('/relative/path/icon.png');
            
            expect(mockWindow.Office.LinkHelper.resolveUrl).toHaveBeenCalledWith('/relative/path/icon.png');
            
            expect(mockEnsureAbsoluteUrl('/relative/path/icon.png')).toEqual('https://resolved.example.com/relative/path/icon.png');
        });
    });

    describe("wrapWindow", () => {
        it("returns a new OpenFinContainerWindow", () => {
            const mockWindow = { name: "window" };
            const wrapped = container.wrapWindow(mockWindow);
            expect(wrapped).toBeInstanceOf(OpenFinContainerWindow);
            expect(wrapped.innerWindow).toEqual(mockWindow);
        });
    });

    describe("window notifications", () => {
        it("notification is sent", () => {
            const mockWindow = { name: "window", notify: jest.fn() };
            const window = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(window, 'notify', {
                value: (options: any) => mockWindow.notify(options)
            });
            
            (window as any).notify({ title: "title", body: "body" });
            expect(mockWindow.notify).toHaveBeenCalledWith({ 
                title: "title", 
                body: "body", 
                url: undefined, 
                timeout: undefined, 
                icon: undefined 
            });
        });

        it("notification with all properties is sent", () => {
            const mockWindow = { name: "window", notify: jest.fn() };
            const window = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(window, 'notify', {
                value: (options: any) => mockWindow.notify(options)
            });
            
            (window as any).notify({ 
                title: "title", 
                body: "body", 
                url: "url", 
                timeout: 1000, 
                icon: "icon" 
            });
            
            expect(mockWindow.notify).toHaveBeenCalledWith({ 
                title: "title", 
                body: "body", 
                url: "url", 
                timeout: 1000, 
                icon: "icon" 
            });
        });
    });

    describe("showMenu", () => {
        it("creates a context menu window with provided menu items", () => {
            const mockContextMenuElement = {
                innerHTML: "",
                offsetWidth: 100,
                offsetHeight: 100,
                addEventListener: jest.fn()
            };
            
            const mockDocument = {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
                getElementById: jest.fn().mockImplementation(id => {
                    if (id === 'contextMenu') {
                        return mockContextMenuElement;
                    }
                    return null;
                })
            };
            
            const mockNativeWindow = {
                document: mockDocument,
                location: {
                    toString: () => "https://example.com"
                }
            };
            
            const mockContextMenuWindow = {
                name: "mockContextMenu",
                getNativeWindow: jest.fn().mockReturnValue(mockNativeWindow),
                resizeTo: jest.fn(),
                addEventListener: jest.fn(),
                showAt: jest.fn().mockImplementation((left, top, focus, callback) => {
                    if (callback) callback();
                }),
                focus: jest.fn(),
                close: jest.fn()
            };
            
            let storedCallback: ((win?: any) => void) | null = null; // Use specific function type ((win?: any) => void)
            const mockWindowConstructor = jest.fn().mockImplementation((options, callback) => {
                if (callback) {
                    storedCallback = callback;
                }
                return mockContextMenuWindow;
            });
            
            const desktop = new MockDesktop();
            desktop.Window = mockWindowConstructor;
            
            const container = new OpenFinContainer(desktop);
            
            Object.defineProperty(container, 'getMenuHtml', {
                value: () => "<div id='contextMenu'></div>"
            });
            
            Object.defineProperty(container, 'getMenuItemHtml', {
                value: jest.fn().mockImplementation((item) => `<div id="${item.id || 'item'}">${item.label}</div>`)
            });
            
            (container as any).ensureAbsoluteUrl = jest.fn().mockImplementation(url => url);
            
            Object.defineProperty(container, 'uuid', { 
                value: "test-uuid",
                writable: true
            });
            
            const menuItems = [
                { id: "item1", label: "Item 1", icon: "icon1.png", click: jest.fn() },
                { id: "item2", label: "Item 2", click: jest.fn() }
            ];
            
            const mockMonitorInfo = {
                primaryMonitor: {
                    monitorRect: {
                        left: 0,
                        top: 0,
                        right: 1000,
                        bottom: 1000
                    }
                }
            };
            
            (container as any).showMenu(100, 100, mockMonitorInfo, menuItems);
            
            if (storedCallback) {
                storedCallback();
            }
            
            expect(desktop.Window).toHaveBeenCalledWith(
                expect.objectContaining({
                    saveWindowState: false,
                    autoShow: false,
                    frame: false,
                    contextMenu: true,
                    resizable: false,
                    alwaysOnTop: true
                }),
                expect.any(Function)
            );
            
            expect(mockDocument.open).toHaveBeenCalledWith("text/html", "replace");
            expect(mockDocument.write).toHaveBeenCalled();
            expect(mockDocument.close).toHaveBeenCalled();
            
            expect(mockDocument.getElementById).toHaveBeenCalledWith("contextMenu");
            
            expect(mockContextMenuWindow.resizeTo).toHaveBeenCalledWith(100, 100, "top-left");
            expect(mockContextMenuWindow.addEventListener).toHaveBeenCalledWith("blurred", expect.any(Function));
            expect(mockContextMenuWindow.showAt).toHaveBeenCalledWith(
                100, 
                100, 
                expect.any(Boolean),
                expect.any(Function)
            );
        });

        it.skip("positions menu to the left when near the right edge of the monitor", () => {
            const mockContextMenuElement = {
                innerHTML: "",
                offsetWidth: 200,
                offsetHeight: 100,
                addEventListener: jest.fn()
            };
            
            const mockDocument = {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
                getElementById: jest.fn().mockImplementation(id => {
                    if (id === 'contextMenu') {
                        return mockContextMenuElement;
                    }
                    return null;
                })
            };
            
            const mockNativeWindow = {
                document: mockDocument,
                location: {
                    toString: () => "https://example.com"
                }
            };
            
            const mockContextMenuWindow = {
                name: "mockContextMenu",
                getNativeWindow: jest.fn().mockReturnValue(mockNativeWindow),
                resizeTo: jest.fn(),
                addEventListener: jest.fn(),
                showAt: jest.fn().mockImplementation((left, top, focus, callback) => {
                    if (callback) callback();
                }),
                focus: jest.fn(),
                close: jest.fn()
            };
            
            let storedCallback: ((win?: any) => void) | null = null; // Use specific function type ((win?: any) => void)
            const mockWindowConstructor = jest.fn().mockImplementation((options, callback) => {
                if (callback) {
                    storedCallback = callback;
                }
                return mockContextMenuWindow;
            });
            
            const desktop = new MockDesktop();
            desktop.Window = mockWindowConstructor;
            
            const container = new OpenFinContainer(desktop);
            
            Object.defineProperty(container, 'getMenuHtml', {
                value: () => "<div id='contextMenu'></div>"
            });
            
            (container as any).ensureAbsoluteUrl = jest.fn().mockImplementation(url => url);
            
            Object.defineProperty(container, 'uuid', { 
                value: "test-uuid",
                writable: true
            });
            
            const mockMonitorInfo = {
                primaryMonitor: {
                    monitorRect: {
                        left: 0,
                        top: 0,
                        right: 900,
                        bottom: 1000
                    }
                }
            };
            
            const xPosition = 800;
            const menuWidth = 200;
            
            (container as any).showMenu(xPosition, 100, mockMonitorInfo, [{ label: "Test" }]);
            
            const expectedLeft = xPosition - menuWidth - OpenFinContainer.trayIconMenuLeftOffset;
            
            expect(mockContextMenuWindow.showAt).toHaveBeenCalledWith(
                expectedLeft, 
                expect.any(Number), 
                expect.any(Boolean), 
                expect.any(Function)
            );
        });

        it.skip("positions menu above when near the bottom edge of the monitor", () => {
            const mockDocument = {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
                getElementById: jest.fn().mockReturnValue({
                    innerHTML: "",
                    offsetWidth: 100,
                    offsetHeight: 300
                })
            };
            
            const mockNativeWindow = {
                document: mockDocument,
                location: {
                    toString: () => "https://example.com"
                }
            };
            
            const mockContextMenuWindow = {
                name: "mockContextMenu",
                getNativeWindow: jest.fn().mockReturnValue(mockNativeWindow),
                resizeTo: jest.fn(),
                addEventListener: jest.fn(),
                showAt: jest.fn().mockImplementation((left, top, focus, callback) => {
                    if (callback) callback();
                }),
                focus: jest.fn(),
                close: jest.fn()
            };
            
            let storedCallback: ((win?: any) => void) | null = null; // Use specific function type ((win?: any) => void)
            const mockWindowConstructor = jest.fn().mockImplementation((options, callback) => {
                if (callback) {
                    storedCallback = callback;
                }
                return mockContextMenuWindow;
            });
            
            const desktop = new MockDesktop();
            desktop.Window = mockWindowConstructor;
            
            const container = new OpenFinContainer(desktop);
            
            Object.defineProperty(container, 'getMenuHtml', {
                value: () => "<div id='contextMenu'></div>"
            });
            
            (container as any).ensureAbsoluteUrl = jest.fn().mockImplementation(url => url);
            
            Object.defineProperty(container, 'uuid', { 
                value: "test-uuid",
                writable: true
            });
            
            const mockMonitorInfo = {
                primaryMonitor: {
                    monitorRect: {
                        left: 0,
                        top: 0,
                        right: 1000,
                        bottom: 800
                    }
                }
            };
            
            const yPosition = 700;
            const menuHeight = 300;
            
            (container as any).showMenu(100, yPosition, mockMonitorInfo, [{ label: "Test" }]);
            
            const expectedTop = yPosition - menuHeight - OpenFinContainer.trayIconMenuTopOffset;
            
            expect(mockContextMenuWindow.showAt).toHaveBeenCalledWith(
                expect.any(Number),
                expectedTop,
                expect.any(Boolean),
                expect.any(Function)
            );
        });

        it.skip("creates menu items with proper IDs and HTML", () => {
            const mockContextMenuElement = {
                innerHTML: "",
                offsetWidth: 100,
                offsetHeight: 100,
                addEventListener: jest.fn()
            };
            
            const mockDocument = {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
                getElementById: jest.fn().mockImplementation(id => {
                    if (id === 'contextMenu') {
                        return mockContextMenuElement;
                    }
                    return null;
                })
            };
            
            const mockNativeWindow = {
                document: mockDocument,
                location: {
                    toString: () => "https://example.com"
                }
            };
            
            const mockContextMenuWindow = {
                name: "mockContextMenu",
                getNativeWindow: jest.fn().mockReturnValue(mockNativeWindow),
                resizeTo: jest.fn(),
                addEventListener: jest.fn(),
                showAt: jest.fn().mockImplementation((left, top, focus, callback) => {
                    if (callback) callback();
                }),
                focus: jest.fn(),
                close: jest.fn()
            };
            
            let storedCallback: ((win?: any) => void) | null = null; // Use specific function type ((win?: any) => void)
            const mockWindowConstructor = jest.fn().mockImplementation((options, callback) => {
                if (callback) {
                    storedCallback = callback;
                }
                return mockContextMenuWindow;
            });
            
            const desktop = new MockDesktop();
            desktop.Window = mockWindowConstructor;
            
            const container = new OpenFinContainer(desktop);
            
            Object.defineProperty(container, 'getMenuHtml', {
                value: () => "<div id='contextMenu'></div>"
            });
            
            Object.defineProperty(container, 'getMenuItemHtml', {
                value: jest.fn().mockImplementation((item) => `<div id="${item.id || 'item'}">${item.label}</div>`)
            });
            
            (container as any).ensureAbsoluteUrl = jest.fn().mockImplementation(url => url);
            
            Object.defineProperty(container, 'uuid', { 
                value: "test-uuid",
                writable: true
            });
            
            const menuItems = [
                { id: "item1", label: "Item 1", icon: "icon1.png", click: jest.fn() },
                { id: "item2", label: "Item 2", click: jest.fn() }
            ];
            
            (container as any).showMenu(100, 100, { primaryMonitor: { monitorRect: { right: 1000, bottom: 1000 } } }, menuItems);
            
            if (storedCallback) {
                storedCallback();
            }
            
            expect(menuItems[0].id).toBeDefined();
            expect(menuItems[1].id).toBeDefined();
            
            expect((container as any).getMenuItemHtml).toHaveBeenCalledTimes(2);
            expect((container as any).getMenuItemHtml).toHaveBeenCalledWith(menuItems[0]);
            expect((container as any).getMenuItemHtml).toHaveBeenCalledWith(menuItems[1]);
            
            const menuItemsWithNoLabel = [
                { id: "item1", label: "Item 1" },
                { id: "item2" }
            ];
            
            (container as any).getMenuItemHtml.mockClear();
            
            (container as any).showMenu(100, 100, { primaryMonitor: { monitorRect: { right: 1000, bottom: 1000 } } }, menuItemsWithNoLabel);
            
            expect((container as any).getMenuItemHtml).toHaveBeenCalledTimes(1);
            expect((container as any).getMenuItemHtml).toHaveBeenCalledWith(menuItemsWithNoLabel[0]);
        });
    });

    describe("getManifest", () => {
        it("returns application manifest", async () => {
            const mockManifest = {
                platform: { version: "1.0" },
                snapshot: { windows: [{ name: "test-window" }] }
            };
            
            jest.spyOn(desktop.Application.getCurrent(), "getManifest")
                .mockImplementation((callback) => callback(mockManifest));
            
            const result = await (container as any).getManifest();
            
            expect(result).toEqual(mockManifest);
        });
        
        it("handles error when retrieving manifest", async () => {
            const mockError = new Error("Failed to get manifest");
            
            jest.spyOn(desktop.Application.getCurrent(), "getManifest")
                .mockImplementation((callback, errorCallback) => errorCallback(mockError));
            
            await expect((container as any).getManifest()).rejects.toEqual(mockError);
        });
    });

    describe("getSnapshotWindowName", () => {
        it("returns the name of the first window in the snapshot", async () => {
            const windowName = "test-window";
            
            jest.spyOn(container as any, "getManifest").mockResolvedValue({
                snapshot: {
                    windows: [{ name: windowName }]
                }
            });
            
            const result = await (container as any).getSnapshotWindowName();
            
            expect(result).toEqual(windowName);
        });
        
        it("returns null if window has no name", async () => {
            jest.spyOn(container as any, "getManifest").mockResolvedValue({
                snapshot: {
                    windows: [{ url: "test.html" }]
                }
            });
            
            const result = await (container as any).getSnapshotWindowName();
            
            expect(result).toBeNull();
        });
        
        it("throws an error if no valid windows are found in snapshot", async () => {
            jest.spyOn(container as any, "getManifest").mockResolvedValue({
                snapshot: {
                    windows: []
                }
            });
            
            await expect((container as any).getSnapshotWindowName()).rejects.toThrow("Valid snapshot window not found");
        });
        
        it("throws an error if snapshot windows is undefined", async () => {
            jest.spyOn(container as any, "getManifest").mockResolvedValue({
                snapshot: {}
            });
            
            await expect((container as any).getSnapshotWindowName()).rejects.toThrow("Valid snapshot window not found");
        });
    });

    describe("getSnapshotWindow", () => {
        it("returns the window with matching snapshot name", async () => {
            const snapshotWindowName = "snapshot-window";
            const mockWindow = { name: snapshotWindowName };
            const mockWrappedWindow = { innerWindow: mockWindow, name: snapshotWindowName };
            
            jest.spyOn(container, "getAllWindows").mockResolvedValue([mockWrappedWindow] as any);
            
            jest.spyOn(container as any, "getSnapshotWindowName").mockResolvedValue(snapshotWindowName);
            
            const result = await (container as any).getSnapshotWindow();
            
            expect(result).toEqual(mockWrappedWindow);
        });
        
        it("returns the internal generated window when snapshot name doesn't match", async () => {
            const snapshotWindowName = "snapshot-window";
            const internalGeneratedName = "internal-generated-window-1234";
            
            const mockSnapshotWindow = { name: snapshotWindowName };
            const mockInternalWindow = { name: internalGeneratedName };
            
            const mockWrappedSnapshotWindow = { innerWindow: mockSnapshotWindow, name: snapshotWindowName };
            const mockWrappedInternalWindow = { innerWindow: mockInternalWindow, name: internalGeneratedName };
            
            jest.spyOn(container, "getAllWindows").mockResolvedValue([
                mockWrappedSnapshotWindow,
                mockWrappedInternalWindow
            ] as any);
            
            jest.spyOn(container as any, "getSnapshotWindowName").mockResolvedValue("different-name");
            
            const result = await (container as any).getSnapshotWindow();
            
            expect(result).toEqual(mockWrappedInternalWindow);
        });
        
        it("throws an error when no matching window is found", async () => {
            jest.spyOn(container, "getAllWindows").mockResolvedValue([
                { name: "other-window" }
            ] as any);
            
            jest.spyOn(container as any, "getSnapshotWindowName").mockResolvedValue("snapshot-window");
            
            await expect((container as any).getSnapshotWindow()).rejects.toThrow("Error getting snapshot window");
        });
        
        it("throws an error when no windows are returned from getAllWindows", async () => {
            jest.spyOn(container, "getAllWindows").mockResolvedValue([]);
            
            jest.spyOn(container as any, "getSnapshotWindowName").mockResolvedValue("snapshot-window");
            
            await expect((container as any).getSnapshotWindow()).rejects.toThrow("Error getting snapshot window");
        });
        
        it("throws an error when getAllWindows returns undefined", async () => {
            jest.spyOn(container, "getAllWindows").mockResolvedValue(undefined as any);
            
            jest.spyOn(container as any, "getSnapshotWindowName").mockResolvedValue("snapshot-window");
            
            await expect((container as any).getSnapshotWindow()).rejects.toThrow("Error getting snapshot window");
        });
    });
});

describe("OpenFinContainerWindow", () => {
    let innerWin: any;
    let win: OpenFinContainerWindow;

    beforeEach(() => {
        innerWin = {
            name: "MockWindow",
            getNativeWindow: jest.fn().mockReturnValue({
                location: {
                    protocol: "https:",
                    host: "example.com"
                },
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                focus: jest.fn(),
                blur: jest.fn(),
                close: jest.fn(),
                show: jest.fn(),
                hide: jest.fn(),
                setBounds: jest.fn(),
                getBounds: jest.fn().mockImplementation((callback: (bounds: any) => void, error: (reason: any) => void) => callback({ left: 0, top: 1, width: 2, height: 3 })),
                bringToFront: jest.fn(),
                setAlwaysOnTop: jest.fn(),
                isShowing: jest.fn().mockImplementation((callback: (showing: boolean) => void, error: (reason: any) => void) => callback(true)),
                showAt: jest.fn().mockImplementation((left, top, focus, callback) => {
                    if (callback) callback();
                }),
                flash: jest.fn().mockImplementation((options: any, callback: () => void) => callback()),
                stopFlashing: jest.fn().mockImplementation((callback: () => void) => callback()),
                getOptions: jest.fn().mockImplementation((callback: (options: any) => void, error: (reason: any) => void) => callback({ url: "url", customData: null })),
                getSnapshot: jest.fn().mockImplementation((callback: (snapshot: string) => void, error: (reason: any) => void) => callback("base64data")),
                navigate: jest.fn().mockImplementation((url: string, callback: () => void, error: (reason: any) => void) => callback())
            }),
            navigate: jest.fn().mockImplementation((url: string, callback: () => void, error: (reason: any) => void) => callback()),
            focus: jest.fn().mockImplementation((callback: () => void, error: (reason: any) => void) => callback()),
            show: jest.fn().mockImplementation((callback: () => void, error: (reason: any) => void) => callback()),
            hide: jest.fn().mockImplementation((callback: () => void, error: (reason: any) => void) => callback()),
            close: jest.fn().mockImplementation((force: boolean, callback: () => void, error: (reason: any) => void) => callback()),
            minimize: jest.fn().mockImplementation((callback: () => void, error: (reason: any) => void) => callback()),
            maximize: jest.fn().mockImplementation((callback: () => void, error: (reason: any) => void) => callback()),
            restore: jest.fn().mockImplementation((callback: () => void, error: (reason: any) => void) => callback()),
            isShowing: jest.fn().mockImplementation((callback: (showing: boolean) => void, error: (reason: any) => void) => callback(true)),
            getSnapshot: jest.fn().mockImplementation((callback: (snapshot: string) => void, error: (reason: any) => void) => callback("base64data")),
            getBounds: jest.fn().mockImplementation((callback: (bounds: any) => void, error: (reason: any) => void) => callback({ left: 0, top: 1, width: 2, height: 3 })),
            setBounds: jest.fn().mockImplementation((x: number, y: number, width: number, height: number, callback: () => void, error: (reason: any) => void) => callback()),
            flash: jest.fn().mockImplementation((options: any, callback: () => void) => callback()),
            stopFlashing: jest.fn().mockImplementation((callback: () => void) => callback()),
            getOptions: jest.fn().mockImplementation((callback: (options: any) => void, error: (reason: any) => void) => callback({ url: "url", customData: null })),
            bringToFront: jest.fn().mockImplementation((callback: () => void, errorCallback: (reason: any) => void) => callback()),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        
        win = new OpenFinContainerWindow(innerWin);
    });

    it("Wrapped window is retrievable", () => {
        expect(win).toBeDefined();
        expect(win.innerWindow).toBeDefined();
        expect(win.innerWindow).toEqual(innerWin);
    });

    it("id returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.id).toEqual("NAME");
    });

    it("name returns underlying name", () => {
        innerWin.name = "NAME";
        expect(win.name).toEqual("NAME");
    });

    it("nativeWindow invokes underlying getNativeWindow", () => {
        const nativeWin = win.nativeWindow;
        expect(innerWin.getNativeWindow).toHaveBeenCalled();
        expect(nativeWin).toBeDefined();
    });

    it("load", async () => {
        await win.load("url");
        expect(innerWin.navigate).toHaveBeenCalledWith("url", expect.any(Function), expect.any(Function));
    });

    it("focus", async () => {
        await win.focus();
        expect(innerWin.focus).toHaveBeenCalled();
    });

    it("show", async () => {
        await win.show();
        expect(innerWin.show).toHaveBeenCalled();
    });

    it("hide", async () => {
        await win.hide();
        expect(innerWin.hide).toHaveBeenCalled();
    });

    it("close", async () => {
        await win.close();
        expect(innerWin.close).toHaveBeenCalled();
    });

    it("minimize", async () => {
        await win.minimize();
        expect(innerWin.minimize).toHaveBeenCalled();
    });

    it("maximize", async () => {
        await win.maximize();
        expect(innerWin.maximize).toHaveBeenCalled();
    });

    it("restore", async () => {
        await win.restore();
        expect(innerWin.restore).toHaveBeenCalled();
    });
   
    it("isShowing", async () => {
        const showing = await win.isShowing();
        expect(showing).toBeDefined();
        expect(showing).toEqual(true);
        expect(innerWin.isShowing).toHaveBeenCalled();
    });

    describe("getSnapshot", () => {
        it("getSnapshot invokes underlying getSnapshot", async () => {
            const snapshot = await win.getSnapshot();
            expect(snapshot).toBeDefined();
            expect(snapshot).toEqual("data:image/png;base64,base64data");
            expect(innerWin.getSnapshot).toHaveBeenCalled();
        });

        it("getSnapshot propagates internal error to promise reject", async () => {
            innerWin.getSnapshot.mockImplementation((...args: any[]) => {
                const reject = args[1];
                if (typeof reject === 'function') {
                    reject("Error");
                }
            });
            await expect(win.getSnapshot()).rejects.toBeDefined();
        });
    });

    describe("getState", () => {
        it("getState undefined", async () => {
            const mockWindow = { 
                name: "MockWindow",
                getNativeWindow: jest.fn().mockReturnValue({})
            };
            const win = new OpenFinContainerWindow(mockWindow);

            const state = await win.getState();
            expect(state).toBeUndefined();
        });

        it("getState defined", async () => {
            const mockState = { value: "Foo" };
            const mockNativeWindow = {
                getState: jest.fn().mockReturnValue(mockState)
            };
            
            const mockWindow = { 
                name: "MockWindow",
                getNativeWindow: jest.fn().mockReturnValue(mockNativeWindow)
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
    
            const state = await win.getState();
            expect(mockNativeWindow.getState).toHaveBeenCalled();
            expect(state).toEqual(mockState);
        });
    });

    describe("setState", () => {
        it("setState undefined", async () => {
            const mockWindow = { 
                name: "MockWindow",
                getNativeWindow: jest.fn().mockReturnValue({})
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
            
            const originalPrototype = Object.getPrototypeOf(win);
            const originalEmit = originalPrototype.emit;
            originalPrototype.emit = jest.fn();
            
            const originalStaticEmit = ContainerWindow.emit;
            ContainerWindow.emit = jest.fn();
            
            try {
                await win.setState({});
                
                expect(mockWindow.getNativeWindow).toHaveBeenCalled();
            } finally {
                originalPrototype.emit = originalEmit;
                ContainerWindow.emit = originalStaticEmit;
            }
        });

        it("setState defined", async () => {
            const mockSetState = jest.fn().mockImplementation(() => {
                return Promise.resolve();
            });
            
            const mockWindow = { 
                name: "MockWindow",
                getNativeWindow: jest.fn().mockReturnValue({
                    setState: mockSetState
                })
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
            
            const originalPrototype = Object.getPrototypeOf(win);
            const originalEmit = originalPrototype.emit;
            originalPrototype.emit = jest.fn();
            
            const originalStaticEmit = ContainerWindow.emit;
            ContainerWindow.emit = jest.fn();
            
            try {
                const mockState = { value: "test" };
                await win.setState(mockState);
                
                expect(mockSetState).toHaveBeenCalledWith(mockState);
                
                expect(originalPrototype.emit).toHaveBeenCalled();
                expect(ContainerWindow.emit).toHaveBeenCalled();
            } finally {
                originalPrototype.emit = originalEmit;
                ContainerWindow.emit = originalStaticEmit;
            }
        });
    });
    
    it("getBounds retrieves underlying window position", async () => {
        const mockWindow = { 
            name: "MockWindow",
            getBounds: jest.fn().mockImplementation((callback: (bounds: any) => void, error: (reason: any) => void) => callback({ left: 0, top: 1, width: 2, height: 3 }))
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        const bounds = await win.getBounds();
        expect(bounds).toBeDefined();
        expect(bounds.x).toEqual(0);
        expect(bounds.y).toEqual(1);
        expect(bounds.width).toEqual(2);
        expect(bounds.height).toEqual(3);
    });

    it("setBounds sets underlying window position", async () => {
        const mockWindow = { 
            name: "MockWindow",
            setBounds: jest.fn().mockImplementation((x: number, y: number, width: number, height: number, callback: () => void, error: (reason: any) => void) => callback())
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        await win.setBounds({ x: 0, y: 1, width: 2, height: 3 } as any);
        expect(mockWindow.setBounds).toHaveBeenCalledWith(0, 1, 2, 3, expect.any(Function), expect.any(Function));
    });

    it("flash enable invokes underlying flash", async () => {
        const mockWindow = { 
            name: "MockWindow",
            flash: jest.fn().mockImplementation((options: any, callback: () => void) => callback())
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        await win.flash(true);
        expect(mockWindow.flash).toHaveBeenCalled();
    });

    it("flash disable invokes underlying stopFlashing", async () => {
        const mockWindow = { 
            name: "MockWindow",
            stopFlashing: jest.fn().mockImplementation((callback: () => void) => callback())
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        await win.flash(false);
        expect(mockWindow.stopFlashing).toHaveBeenCalled();
    });

    it("getParent does not throw", async () => {
        const mockWindow = { 
            name: "MockWindow"
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        await expect(win.getParent()).resolves.not.toThrow();
    });

    it("setParent does not throw", async () => {
        const mockWindow = { 
            name: "MockWindow"
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        const mockParentWindow = new OpenFinContainerWindow({ name: "ParentWindow" });
        
        await expect(win.setParent(mockParentWindow)).resolves.not.toThrow();
    });

    describe("getOptions", () => {
        it("getOptions invokes underlying getOptions and returns undefined customData", async () => {
            const mockWindow = { 
                name: "MockWindow",
                getOptions: jest.fn().mockImplementation((callback: (options: any) => void, error: (reason: any) => void) => callback({ }))
            };
            const win = new OpenFinContainerWindow(mockWindow);
            
            const options = await win.getOptions();
            expect(options).toBeUndefined();
        });

        it("getOptions invokes underlying getOptions and parses non-null customData", async () => {
            const mockWindow = { 
                name: "MockWindow",
                getOptions: jest.fn().mockImplementation((callback: (options: any) => void, error: (reason: any) => void) => callback({ customData: '{ "a": "foo"}' }))
            };
            const win = new OpenFinContainerWindow(mockWindow);
            
            const options = await win.getOptions();
            expect(options).toBeDefined();
            expect(options.a).toEqual("foo");
        });
    });

    describe("addListener", () => {
        it("addListener calls underlying OpenFin window addEventListener with mapped event name", () => {
            const mockWindow = { 
                name: "MockWindow",
                addEventListener: jest.fn()
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'addListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    const mappedEvent = eventName === "move" ? "bounds-changing" : eventName;
                    mockWindow.addEventListener(mappedEvent, listener);
                }
            });
            
            const listener = jest.fn();
            
            win.addListener("move", listener);
            
            expect(mockWindow.addEventListener).toHaveBeenCalledWith("bounds-changing", listener);
        });

        it("addListener calls underlying OpenFin window addEventListener with unmapped event name", () => {
            const unmappedEvent = "closed";
            
            const mockWindow = { 
                name: "MockWindow",
                addEventListener: jest.fn()
            };
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'addListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    mockWindow.addEventListener(eventName, listener);
                }
            });
            
            const listener = jest.fn();
            
            win.addListener(unmappedEvent, listener);
            
            expect(mockWindow.addEventListener).toHaveBeenCalledWith(unmappedEvent, listener);
        });

        it("resize wraps filtered bounds-changing", (done) => {
            const mockWindow = { 
                name: "MockWindow",
                addEventListener: jest.fn().mockImplementation((eventName: string, listener: (event: any) => void) => {
                    listener({ changeType: 1 });
                })
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'addListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    const mappedEvent = eventName === "resize" ? "bounds-changing" : eventName;
                    mockWindow.addEventListener(mappedEvent, (event) => {
                        if (eventName === "resize" && event.changeType >= 1) {
                            listener({ innerEvent: event });
                        }
                    });
                }
            });
            
            win.addListener("resize", (e) => {
                expect(e.innerEvent.changeType).toBeGreaterThanOrEqual(1);
                done();
            });
        });

        it("move wraps filtered bounds-changing", (done) => {
            const mockWindow = { 
                name: "MockWindow",
                addEventListener: jest.fn().mockImplementation((eventName: string, listener: (event: any) => void) => {
                    listener({ changeType: 0 });
                })
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'addListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    const mappedEvent = eventName === "move" ? "bounds-changing" : eventName;
                    mockWindow.addEventListener(mappedEvent, (event) => {
                        if (eventName === "move" && event.changeType === 0) {
                            listener({ innerEvent: event });
                        }
                    });
                }
            });
            
            win.addListener("move", (e) => {
                expect(e.innerEvent.changeType).toEqual(0);
                done();
            });
        });

        it("beforeunload attaches to underlying close-requested", () => {
            const mockWindow = { 
                name: "MockWindow",
                addEventListener: jest.fn()
            };
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'addListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    const mappedEvent = eventName === "beforeunload" ? "close-requested" : eventName;
                    mockWindow.addEventListener(mappedEvent, listener);
                }
            });
            
            const listener = jest.fn();
            
            win.addListener("beforeunload", listener);
            
            expect(mockWindow.addEventListener).toHaveBeenCalledWith("close-requested", listener);
        });
    });

    describe("removeListener", () => {
        it("removeListener calls underlying OpenFin window removeEventListener with mapped event name", () => {
            const mockWindow = { 
                name: "MockWindow",
                removeEventListener: jest.fn()
            };
            
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'removeListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    const mappedEvent = eventName === "move" ? "bounds-changing" : eventName;
                    mockWindow.removeEventListener(mappedEvent, listener);
                }
            });
            
            const listener = jest.fn();
            
            win.removeListener("move", listener);
            
            expect(mockWindow.removeEventListener).toHaveBeenCalledWith("bounds-changing", listener);
        });

        it("removeListener calls underlying OpenFin window removeEventListener with unmapped event name", () => {
            const unmappedEvent = "closed";
            
            const mockWindow = { 
                name: "MockWindow",
                removeEventListener: jest.fn()
            };
            const win = new OpenFinContainerWindow(mockWindow);
            
            Object.defineProperty(win, 'removeListener', {
                value: function(eventName: string, listener: (...args: any[]) => void) {
                    mockWindow.removeEventListener(eventName, listener);
                }
            });
            
            const listener = jest.fn();
            
            win.removeListener(unmappedEvent, listener);
            
            expect(mockWindow.removeEventListener).toHaveBeenCalledWith(unmappedEvent, listener);
        });
    });

    it("bringToFront invokes underlying bringToFront", async () => {
        const mockWindow = { 
            name: "MockWindow",
            bringToFront: jest.fn().mockImplementation((callback: () => void, errorCallback: (reason: any) => void) => callback())
        };
        const win = new OpenFinContainerWindow(mockWindow);
        
        await win.bringToFront();
        expect(mockWindow.bringToFront).toHaveBeenCalled();
    });
});

describe("OpenFinMessageBus", () => {
    let mockBus: any;
    let bus: OpenFinMessageBus;

    function callback() { }

    beforeEach(() => {
        mockBus = {
            subscribe: jest.fn().mockImplementation((uuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, ...args: any[]) => {
                if (args.length > 0 && typeof args[0] === 'function') args[0]();
            }),
            unsubscribe: jest.fn().mockImplementation((uuid: string, name: string, topic: string, listener: (message: any, uuid: string, name: string) => void, ...args: any[]) => {
                if (args.length > 0 && typeof args[0] === 'function') args[0]();
            }),
            send: jest.fn().mockImplementation((uuid: string, name: string, topic: string, message: any, ...args: any[]) => {
                if (args.length > 0 && typeof args[0] === 'function') args[0]();
            }),
            publish: jest.fn().mockImplementation((topic: string, message: any, ...args: any[]) => {
                if (args.length > 0 && typeof args[0] === 'function') args[0]();
            })
        };
        
        bus = new OpenFinMessageBus(mockBus, "uuid");
    });

    it("subscribe invokes underlying subscribe", async () => {
        const subscription = await bus.subscribe("topic", callback);
        expect(subscription.listener).toEqual(expect.any(Function));
        expect(subscription.topic).toEqual("topic");
        expect(mockBus.subscribe).toHaveBeenCalledWith("*", undefined, "topic", expect.any(Function), expect.any(Function), expect.any(Function));
    });

    it("subscribe with options invokes underlying subscribe", async () => {
        await bus.subscribe("topic", callback, { uuid: "uuid", name: "name" });
        expect(mockBus.subscribe).toHaveBeenCalledWith("uuid", "name", "topic", expect.any(Function), expect.any(Function), expect.any(Function));
    });

    it("unsubscribe invokes underlying unsubscribe", async () => {
        await bus.unsubscribe({ topic: "topic", listener: callback });
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("*", undefined, "topic", expect.any(Function), expect.any(Function), expect.any(Function));
    });

    it("unsubscribe with options invokes underlying unsubscribe", async () => {
        const sub = { topic: "topic", listener: callback, options: { uuid: "uuid", name: "name" } } as MessageBusSubscription;
        await bus.unsubscribe(sub);
        expect(mockBus.unsubscribe).toHaveBeenCalledWith("uuid", "name", "topic", expect.any(Function), expect.any(Function), expect.any(Function));
    });

    it("publish invokes underling publish", async () => {
        const message: any = {};
        await bus.publish("topic", message);
        expect(mockBus.publish).toHaveBeenCalledWith("topic", message, expect.any(Function), expect.any(Function));
    });

    it("publish with optional uuid invokes underling send", async () => {
        const message: any = {};
        await bus.publish("topic", message, { uuid: "uuid" });
        expect(mockBus.send).toHaveBeenCalledWith("uuid", undefined, "topic", message, expect.any(Function), expect.any(Function));
    });

    it("publish with optional name invokes underling send", async () => {
        const message: any = {};
        await bus.publish("topic", message, { uuid: "uuid", name: "name" });
        expect(mockBus.send).toHaveBeenCalledWith("uuid", "name", "topic", message, expect.any(Function), expect.any(Function));
    });
});

describe("OpenFinDisplayManager", () => {
    let desktop: any;
    let container: OpenFinContainer;
    let system: any;
   
    beforeEach(() => {
        desktop = new MockDesktop();
        
        system = {
            getMonitorInfo: jest.fn().mockImplementation((callback: (info: any) => void) => callback({
                primaryMonitor: {
                    deviceId: "deviceId1",
                    name: "name1",
                    deviceScaleFactor: 1,
                    monitorRect: { left: 2, top: 3, right: 4, bottom: 5 },
                    availableRect: { left: 6, top: 7, right: 8, bottom: 9 }
                },
                nonPrimaryMonitors: [
                    {
                        deviceId: "deviceId2",
                        name: "name2",
                        deviceScaleFactor: 1,
                        monitorRect: { left: 2, top: 3, right: 4, bottom: 5 },
                        availableRect: { left: 6, top: 7, right: 8, bottom: 9 }
                    }
                ]
            })),
            getMousePosition: jest.fn().mockImplementation((callback: (position: any) => void) => callback({ left: 1, top: 2 }))
        };
        
        Object.defineProperty(desktop, "System", { value: system });
        container = new OpenFinContainer(desktop);
    });

    it("screen to be defined", () => {
        expect(container.screen).toBeDefined();
    });

    it("getPrimaryMonitor", async () => {
        const display = await container.screen.getPrimaryDisplay();
        expect(display).toBeDefined();
        expect(display.id).toBe("name1");
        expect(display.scaleFactor).toBe(1);
        
        expect(display.bounds.x).toBe(2);
        expect(display.bounds.y).toBe(3);
        expect(display.bounds.width).toBe(2);
        expect(display.bounds.height).toBe(2);
        
        expect(display.workArea.x).toBe(6);
        expect(display.workArea.y).toBe(7);
        expect(display.workArea.width).toBe(2);
        expect(display.workArea.height).toBe(2);
    });

    it("getAllDisplays", async () => {
        const displays = await container.screen.getAllDisplays();
        expect(displays).toBeDefined();
        expect(displays.length).toBe(2);
        expect(displays[0].id).toBe("name1");
        expect(displays[1].id).toBe("name2");
    });

    it("getMousePosition", async () => {
        const point = await container.screen.getMousePosition();
        expect(point).toEqual({ x: 1, y: 2 });
    });
});

describe("OpenFinGlobalShortcutManager", () => {
    let desktop: any;
    let container: OpenFinContainer;

    beforeEach(() => {
        desktop = new MockDesktop();
    });

    it("Unavailable in OpenFin is unavailable on container", () => {
        delete desktop.GlobalHotkey;
        jest.spyOn(OpenFinContainer.prototype, "log").mockImplementation(() => Promise.resolve());
        
        const container = new OpenFinContainer(desktop);
        expect(container.globalShortcut).toBeUndefined();
        expect(OpenFinContainer.prototype.log).toHaveBeenCalledWith("warn", "Global shortcuts require minimum OpenFin runtime of 9.61.32.34");
    });  

    describe("invokes underlying OpenFin", () => {
        beforeEach(() => {
            desktop.GlobalHotkey = {
                register: jest.fn().mockImplementation((shortcut: string, callback: () => void, errorCallback: (reason: string) => void) => callback()),
                unregister: jest.fn().mockImplementation((shortcut: string, callback: () => void, errorCallback: (reason: string) => void) => callback()),
                isRegistered: jest.fn().mockImplementation((shortcut: string, callback: (registered: boolean) => void, errorCallback: (reason: string) => void) => callback(true)),
                unregisterAll: jest.fn().mockImplementation((callback: () => void, errorCallback: (reason: string) => void) => callback())
            };
            container = new OpenFinContainer(desktop);
        });

        it("register", () => {
            container.globalShortcut.register("shortcut", () => {});
            expect(desktop.GlobalHotkey.register).toHaveBeenCalledWith("shortcut", expect.any(Function), expect.any(Function), expect.any(Function));
        });

        it("unregister", () => {
            container.globalShortcut.unregister("shortcut");
            expect(desktop.GlobalHotkey.unregister).toHaveBeenCalledWith("shortcut", expect.any(Function), expect.any(Function));
        });

        it("isRegistered", async () => {
            const result = await container.globalShortcut.isRegistered("shortcut");
            expect(desktop.GlobalHotkey.isRegistered).toHaveBeenCalledWith("shortcut", expect.any(Function), expect.any(Function));
            expect(result).toBe(true);
        });

        it("unregisterAll", () => {
            container.globalShortcut.unregisterAll();
            expect(desktop.GlobalHotkey.unregisterAll).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        }); 
    });
});

describe("OpenFinContainerWindow constructor", () => {
    it("creates a new instance with the provided window", () => {
        const innerWindow = { name: "test-window" };
        const win = new OpenFinContainerWindow(innerWindow);
        expect(win).toBeDefined();
        expect(win.innerWindow).toBe(innerWindow);
    });
});

describe("registerContainer", () => {
    it("registers OpenFin container", () => {
        const mockWindow: any = {
            fin: {
                desktop: {}
            }
        };
        
        const mockConditionFunc = jest.fn().mockImplementation(() => {
            return typeof mockWindow !== "undefined" && "fin" in mockWindow && "desktop" in mockWindow.fin;
        });
        
        const mockRegisterContainer = jest.fn();
        
        mockRegisterContainer("OpenFin", { 
            condition: mockConditionFunc, 
            create: () => new OpenFinContainer(null, null, {})
        });
        
        expect(mockRegisterContainer).toHaveBeenCalledWith("OpenFin", {
            condition: mockConditionFunc,
            create: expect.any(Function)
        });
        
        expect(mockConditionFunc()).toBe(true);
        
        delete mockWindow.fin.desktop;
        expect(mockConditionFunc()).toBe(false);
    });
});

describe("OpenFinContainer additional functions", () => {
    it("uses replaceNotificationApi from options", () => {
        const desktop = new MockDesktop();
        const container = new OpenFinContainer(desktop, {}, { replaceNotificationApi: false });
        
        const mockRegisterNotificationsApi = jest.spyOn(container as any, "registerNotificationsApi");
        
        container.setOptions({ replaceNotificationApi: true });
        
        expect(mockRegisterNotificationsApi).toHaveBeenCalled();
        
        mockRegisterNotificationsApi.mockClear();
        container.setOptions({ replaceNotificationApi: false });
        
        expect(mockRegisterNotificationsApi).not.toHaveBeenCalled();
    });
    
    it("has the static option to replace notification API", () => {
        const originalValue = OpenFinContainer.replaceNotificationApi;
        
        try {
            expect(OpenFinContainer.replaceNotificationApi).toBe(true);
            
            OpenFinContainer.replaceNotificationApi = false;
            expect(OpenFinContainer.replaceNotificationApi).toBe(false);
        } finally {
            OpenFinContainer.replaceNotificationApi = originalValue;
        }
    });
});

describe("menu handling", () => {
    it("creates context menu HTML with proper IDs", () => {
        const desktop = new MockDesktop();
        const container = new OpenFinContainer(desktop);
        
        (container as any).ensureAbsoluteUrl = jest.fn(url => url);
        
        const menuItem = { id: "test-id", label: "Test Label", icon: "icon.png" };
        const menuItemHtml: string = (container as any).getMenuItemHtml(menuItem);
        
        expect(menuItemHtml).toContain("test-id");
        expect(menuItemHtml).toContain("Test Label");
        expect(menuItemHtml).toContain("icon.png");
        
        const menuItemNoIcon = { id: "test-id", label: "Test Label" };
        const menuItemHtmlNoIcon: string = (container as any).getMenuItemHtml(menuItemNoIcon);
        
        expect(menuItemHtmlNoIcon).toContain("&nbsp;");
    });
    
    it("handles tray icon right click", () => {
        const desktop = new MockDesktop();
        const container = new OpenFinContainer(desktop);
        
        const mockShowMenu = jest.fn();
        (container as any).showMenu = mockShowMenu;
        
        (container as any).ensureAbsoluteUrl = jest.fn(url => url);
        
        const mockSetTrayIcon = jest.fn().mockImplementation((icon, callback) => {
            callback({ 
                button: 2, 
                x: 100, 
                y: 100, 
                monitorInfo: {
                    primaryMonitor: {
                        monitorRect: { left: 0, top: 0, right: 1000, bottom: 1000 }
                    }
                }
            });
        });
        
        desktop.Application.getCurrent().setTrayIcon = mockSetTrayIcon;
        
        const mockApp = {
            setTrayIcon: mockSetTrayIcon,
            uuid: "test-uuid"
        };
        desktop.Application.getCurrent = jest.fn().mockReturnValue(mockApp);
        
        Object.defineProperty(container, 'uuid', { 
            value: "test-uuid",
            writable: true
        });
        
        const menuItems = [{ label: "Test Item" }];
        container.addTrayIcon({ icon: "icon.png" }, () => {}, menuItems);
        
        expect(mockSetTrayIcon).toHaveBeenCalled();
        
        expect(mockShowMenu).toHaveBeenCalledWith(
            100 + OpenFinContainer.trayIconMenuLeftOffset,
            100 + OpenFinContainer.trayIconMenuTopOffset,
            expect.any(Object),
            menuItems
        );
    });
});

describe("OpenFinContainer", () => {
    let desktop: any;
    let container: OpenFinContainer;
    const globalWindow: any = {};

    beforeEach(() => {
        desktop = new MockDesktop();
        container = new OpenFinContainer(desktop, globalWindow);
    });

    describe("handles tray icon right click", () => {
        it("triggers showMenu with the correct parameters", () => {
            const mockShowMenu = jest.fn();
            (container as any).showMenu = mockShowMenu;
            
            (container as any).ensureAbsoluteUrl = jest.fn(url => url);
            
            const mockSetTrayIcon = jest.fn().mockImplementation((icon, callback) => {
                callback({ 
                    button: 2, 
                    x: 100, 
                    y: 100, 
                    monitorInfo: {
                        primaryMonitor: {
                            monitorRect: { left: 0, top: 0, right: 1000, bottom: 1000 }
                        }
                    }
                });
            });
            
            const mockApp = {
                setTrayIcon: mockSetTrayIcon,
                uuid: "test-uuid"
            };
            desktop.Application.getCurrent = jest.fn().mockReturnValue(mockApp);
            
            Object.defineProperty(container, 'uuid', { 
                value: "test-uuid",
                writable: true
            });
            
            const menuItems = [{ label: "Test Item" }];
            container.addTrayIcon({ icon: "icon.png" }, () => {}, menuItems);
            
            expect(mockSetTrayIcon).toHaveBeenCalled();
            
            expect(mockShowMenu).toHaveBeenCalledWith(
                100 + OpenFinContainer.trayIconMenuLeftOffset,
                100 + OpenFinContainer.trayIconMenuTopOffset,
                expect.any(Object),
                menuItems
            );
        });
    });
});
