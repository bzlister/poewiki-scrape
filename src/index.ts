import fs from "fs";
import captureWebsite from "capture-website";
import { escape } from "querystring";
import { parse, stringify } from "yaml";

type Config = {
  out: string;
  nodes: string[];
  items: (string | Record<string, string[]>)[];
  skills: string[];
};

const config: Config = parse(fs.readFileSync("./config.yml", "utf8"));
if (
  config.out.charAt(config.out.length - 1) !== "/" ||
  config.out.charAt(config.out.length - 1) !== "\\"
) {
  config.out = config.out + "/";
}

const assets = {
  nodes: collateAssets(fs.readdirSync("assets/nodes")),
  items: collateAssets(fs.readdirSync("assets/items")),
  skills: collateAssets(fs.readdirSync("assets/skills")),
};

Promise.all([
  ...(config.nodes || []).map(getNodeAsset),
  ...(config.items || []).map(getItemAsset),
  ...(config.skills || []).map(getSkillAsset),
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
          overwrite: true,
        })
        .then(() => fs.promises.copyFile(file, `assets/nodes/${name}.png`));
    }
  } catch (err) {
    console.log(`Error getting node asset ${name}.\nError: ${err}`);
    return Promise.resolve();
  }
}

function getItemAsset(item: string | Record<string, string[]>): Promise<void> {
  const name = typeof item === "string" ? item : Object.keys(item)[0];

  try {
    if (assets.items[name]) {
      return fs.promises.copyFile(
        `assets/items/${assets.items[name]}`,
        `${config.out}${assets.items[name]}`
      );
    } else {
      const encoded = escape(name.replaceAll(" ", "_"));
      const file = `${config.out}${name}.png`;
      let scripts: string | undefined;
      if (typeof item !== "string") {
        scripts = `
const root = document.querySelector("span.item-box");
const table = root.querySelector("table");
if (table) {
  table.remove();
}
const mods = root.querySelector("span.item-stats > span.group.tc.-mod");
`;

        const createTextNodes = item[name].map(
          (mod) => `mods.appendChild(document.createTextNode("${mod}"));`
        );
        scripts += createTextNodes.reduce(
          (prev, curr) =>
            `${prev}\r\nmods.appendChild(document.createElement("br"));\r\n${curr}`
        );
      }
      return captureWebsite
        .file(`https://www.poewiki.net/wiki/${encoded}`, file, {
          element: "span.item-box",
          overwrite: true,
          ...(scripts && { modules: [scripts] }),
        })
        .then(() => fs.promises.copyFile(file, `assets/items/${name}.png`));
    }
  } catch (err) {
    console.log(`Error getting item asset ${name}.\nError: ${err}`);
    return Promise.resolve();
  }
}

export function getSkillAsset(name: string): Promise<void> {
  try {
    if (assets.skills[name]) {
      return fs.promises.copyFile(
        `assets/skills/${assets.skills[name]}`,
        `${config.out}${assets.skills[name]}`
      );
    } else {
      const encoded = escape(name.replaceAll(" ", "_"));
      const file = `${config.out}${name}.png`;
      return captureWebsite
        .file(`https://www.poewiki.net/wiki/${encoded}`, file, {
          element: "span.item-box",
          overwrite: true,
        })
        .then(() => fs.promises.copyFile(file, `assets/skills/${name}.png`));
    }
  } catch (err) {
    console.log(`Error getting skill asset ${name}.\nError: ${err}`);
    return Promise.resolve();
  }
}
