/**
 * Registers the bundled Phosphor icon subset with Iconify so that all
 * <Icon icon="ph:..."> usages render from local data instead of firing a
 * runtime network request to api.iconify.design.
 *
 * Previously every first render triggered 1-2 blocking requests to
 * api.iconify.design (700ms-1.5s each on the PageSpeed traces), sitting
 * directly on the critical rendering path. Importing this module once,
 * before any component renders an <Icon>, removes those requests entirely.
 */
import { addCollection } from "@iconify/svelte";
import phIconsData from "./ph-icons-data";

addCollection(phIconsData);
