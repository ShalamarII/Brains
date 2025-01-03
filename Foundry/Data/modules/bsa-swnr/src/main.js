import { SWNR } from "./SWNR.js";
Hooks.on("beavers-system-interface.init", async function () {
	beaversSystemInterface.register(new SWNR());
});
