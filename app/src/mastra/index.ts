import { Mastra } from "@mastra/core";
import { workspaceMarker } from "@repro/versionless";

export const mastra = new Mastra({
  idGenerator: () => workspaceMarker,
  bundler: {
    transpilePackages: ["@repro/versionless"],
  },
});
