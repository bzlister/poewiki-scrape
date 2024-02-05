import fs from "fs";
import captureWebsite from "capture-website";
import { escape } from "querystring";
import { parse, stringify } from "yaml";

type Config = {
  out: string;
  nodes: string[];
  items: string[];
};

const config: Config = parse(fs.readFileSync("./config.yml", "utf8"));
if (
  config.out.charAt(config.out.length - 1) !== "/" ||
  config.out.charAt(config.out.length - 1) !== "\\"
)
  config.out = config.out + "/";

const assets = {
  nodes: collateAssets(fs.readdirSync("assets/nodes")),
  items: collateAssets(fs.readdirSync("assets/items")),
};

console.log(JSON.stringify(assets));

Promise.all([
  ...(config.nodes || []).map(getNodeAsset),
  ...(config.items || []).map(getItemAsset),
]).then(() => console.log("Done"));

function collateAssets(filenames: string[]): Record<string, string> {
  return (filenames || []).reduce(
    (prev, curr) => ({
      ...prev,
      [curr.substring(0, curr.lastIndexOf("."))]: curr,
    }),
    {}
  );
}

function getNodeAsset(name: string): Promise<void> {
  try {
    if (assets.nodes[name]) {
      return fs.promises.copyFile(
        `assets/nodes/${assets.nodes[name]}`,
        `${config.out}${assets.nodes[name]}`
      );
    } else {
      const encoded = escape(name.replaceAll(" ", "_"));
      const file = `${config.out}${name}.png`;
      return captureWebsite
        .file(`https://www.poewiki.net/wiki/${encoded}`, file, {
          element: "div.info-card__card",
        })
        .then(() => fs.promises.copyFile(file, `assets/nodes/${name}.png`));
    }
  } catch (err) {
    console.log(`Error getting node asset ${name}.\nError: ${err}`);
    return Promise.resolve();
  }
}

function getItemAsset(name: string): Promise<void> {
  try {
    if (assets.items[name]) {
      return fs.promises.copyFile(
        `assets/items/${assets.items[name]}`,
        `${config.out}${assets.items[name]}`
      );
    } else {
      const encoded = escape(name.replaceAll(" ", "_"));
      const file = `${config.out}${name}.png`;
      return captureWebsite
        .file(`https://www.poewiki.net/wiki/${encoded}`, file, {
          element: "span.item-box",
        })
        .then(() => fs.promises.copyFile(file, `assets/items/${name}.png`));
    }
  } catch (err) {
    console.log(`Error getting item asset ${name}.\nError: ${err}`);
    return Promise.resolve();
  }
}
