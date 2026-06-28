import { defineStore } from "pinia";

// An item inside an area is either an app ({name,url,icon}) or a folder.
export const isFolder = (item) => !!item && item.type === "folder";

function arrayMove(arr, from, to) {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
  const [el] = arr.splice(from, 1);
  arr.splice(to, 0, el);
}

function normalizeUrl(input) {
  if (!input) return null;
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s.replace(/^\/+/, "");
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export const useAreaStore = defineStore("areaStore", {
  state: () => ({
    areas: [
      {
        label: "Kodlama & Geliştirme",
        background:
          "https://4kwallpapers.com/images/wallpapers/ios-13-stock-ipados-green-black-background-amoled-ipad-hd-3840x2160-793.jpg",
        apps: [
          { name: "GitHub", url: "https://github.com/mertcan-tas" },

          {
            name: "Stackoverflow",
            url: "https://stackoverflow.com/questions",
          },
          {
            name: "Codewars",
            url: "https://www.codewars.com/dashboard",
          },
          {
            name: "Freecodecamp",
            url: "https://www.freecodecamp.org/learn/project-euler/",
          },

          { name: "Hackerrank", url: "https://www.hackerrank.com/dashboard" },

          { name: "API Desing", url: "https://roadmap.sh/api-design" },
          {
            name: "Gitlab",
            url: "https://gitlab.com/users/mertcan-tas/projects ",
          },
          { name: "Gitee", url: "https://gitee.com/explore " },
          { name: "Docker Hub", url: "https://hub.docker.com/ " },
          {
            name: "Docker Docs",
            url: "https://docs.docker.com/reference/cli/docker/ ",
          },
          {
            name: "Gitignore",
            url: "https://www.toptal.com/developers/gitignore/ ",
          },
          {
            name: "MDN Docs.",
            url: "https://developer.mozilla.org/en-US/docs/Learn_web_development ",
          },
          { name: "Visualgo", url: "https://visualgo.net/en " },
          {
            name: "Goalkicker",
            url: "https://books.goalkicker.com/ ",
          },
          { name: "Roadmap", url: "https://roadmap.sh " },
          { name: "Flutter Pcks.", url: "https://pub.dev/packages " },
          {
            name: "Codecademy",
            url: "https://www.codecademy.com/learn ",
          },
          {
            name: "SMS API",
            url: "https://panel.iletimerkezi.com/auth/login ",
          },
          {
            name: "SMS Docs",
            url: "https://www.toplusmsapi.com/ornekler/python-sms-gonderim-raporu ",
          },
          {
            name: "Font Source",
            url: "https://fontsource.org/",
          },
          {
            name: "Redis Books",
            url: "https://redis.io/ebooks/",
          },
        ],
      },
      {
        label: "Tasarım & UI/UX",
        background:
          "https://4kwallpapers.com/images/wallpapers/windows-11-bloom-collection-blue-background-blue-abstract-3840x2160-9033.jpg",
        apps: [
          { name: "Dribbble", url: "https://dribbble.com/ " },
          { name: "Behance", url: "https://www.behance.net/ " },
          { name: "Mockuptree", url: "https://mockuptree.com/ " },
          { name: "Freepik", url: "https://www.freepik.com/ " },
          { name: "Vecteezy", url: "https://www.vecteezy.com/ " },
          { name: "Unsplash", url: "https://unsplash.com/ " },
          { name: "Undraw", url: "https://undraw.co/illustrations " },
          {
            name: "Manypixels",
            url: "https://www.manypixels.co/gallery ",
          },
          {
            name: "Illustrations",
            url: "https://freeillustrations.xyz/ ",
          },
          { name: "Flaticon", url: "https://www.flaticon.com/ " },
          {
            name: "Bootstrap Icons",
            url: "https://icons.getbootstrap.com/ ",
          },
          {
            name: "Icon Park",
            url: "https://iconpark.oceanengine.com/official ",
          },
          { name: "Icon Monster", url: "https://iconmonstr.com/ " },
          { name: "Seek Logo", url: "https://seeklogo.com/ " },
          {
            name: "World Vector",
            url: "https://worldvectorlogo.com/ ",
          },
          { name: "Logo Book", url: "http://logobook.com/" },
          {
            name: "Lottie",
            url: "https://lottiefiles.com/free-animations/loader ",
          },
          {
            name: "UI Store",
            url: "https://www.uistore.design/types/adobe-xd/ ",
          },
          {
            name: "Muz Li",
            url: "https://muz.li/inspiration/uikits/ ",
          },
          {
            name: "Color Name",
            url: "https://www.color-name.com/hex/ed5623 ",
          },
          { name: "UI Colors", url: "https://uicolors.app/create " },
          { name: "Eva Colors", url: "https://colors.eva.design/ " },
          { name: "Icon Kitchen", url: "https://icon.kitchen/ " },
        ],
      },
      {
        label: "İş & Sosyal Medya",
        background:
          "https://4kwallpapers.com/images/wallpapers/road-mountains-tarmac-sunrise-morning-macos-big-sur-stock-5k-3840x2160-3996.jpg",
        apps: [
          {
            name: "Linkedin",
            url: "https://www.linkedin.com/feed/ ",
          },
          {
            name: "Linkedin Learn",
            url: "https://www.linkedin.com/learning/ ",
          },
          {
            name: "BTK Akademi",
            url: "https://www.btkakademi.gov.tr/portal ",
          },
          {
            name: "Udemy",
            url: "https://www.udemy.com/home/my-courses/learning/ ",
          },
          { name: "YouTube", url: "https://www.youtube.com/ " },
          { name: "Reddit", url: "https://www.reddit.com/ " },
          { name: "Techcrunch", url: "https://techcrunch.com/ " },
          {
            name: "Hacker News",
            url: "https://news.ycombinator.com/ ",
          },
          { name: "Pinterest", url: "https://tr.pinterest.com/ " },
          { name: "Telegram", url: "https://web.telegram.org/a/ " },
          {
            name: "Doc. Translate",
            url: "https://app.immersivetranslate.com/ ",
          },
          { name: "Kaggle", url: "https://www.kaggle.com/ " },
          {
            name: "Yazılım Turkiye",
            url: "https://www.yazilimturkiye.com/ ",
          },
          { name: "Ororo", url: "https://ororo.tv/en/channels " },
        ],
      },
      {
        label: "Yardımcı Araçlar",
        background:
          "https://4kwallpapers.com/images/wallpapers/abstract-background-3840x2160-11615.png",
        apps: [
          { name: "Qwen", url: "https://chat.qwen.ai/ " },
          { name: "DeepSeek", url: "https://chat.deepseek.com/ " },
          { name: "Gemini", url: "https://gemini.google.com/app " },
          { name: "Claude", url: "https://claude.ai/new " },
          { name: "Chatgpt", url: "https://chatgpt.com/ " },
          { name: "Keybr", url: "https://www.keybr.com/ " },
          { name: "Lifeofpix", url: "https://www.lifeofpix.com/ " },
          { name: "Coverr", url: "https://coverr.co/ " },
          { name: "Storyset", url: "https://storyset.com/ " },
          {
            name: "HTML Minify",
            url: "http://html-minify.online-domain-tools.com/",
          },
          {
            name: "HTML Format",
            url: "https://www.freeformatter.com/html-formatter.html ",
          },
          {
            name: "Credit Gen.",
            url: "https://iplogger.org/creditCardGenerator/ ",
          },
          {
            name: "UUI Gen.",
            url: "https://www.uuidgenerator.net/version4 ",
          },
          {
            name: "MD5 Gen.",
            url: "https://onlinehashtools.com/generate-random-md5-hash ",
          },
          { name: "Theme Lock", url: "https://themelock.com/eng/ " },
          {
            name: "Crackthemes",
            url: "https://www.crackthemes.com/ ",
          },
          {
            name: "Nulled Scripts",
            url: "http://www.nulled-scripts.xyz/",
          },
          { name: "WP Null 24", url: "https://wpnull24.net/ " },
          { name: "Nulled One", url: "https://nulled.one/ " },
          {
            name: "Torrent Mac",
            url: "https://www.torrentmac.net/ ",
          },
          { name: "Tineye", url: "https://tineye.com/ " },
          {
            name: "Eleven Labs",
            url: "https://elevenlabs.io/app/speech-synthesis/text-to-speech ",
          },
          {
            name: "Base64 Con.",
            url: "https://base64.guru/converter/encode/image ",
          },
          {
            name: "agromonitoring",
            url: "https://agromonitoring.com/ ",
          },
          { name: "4KWallpapers", url: "https://4kwallpapers.com/ " },
          {
            name: "Scrnshts Club",
            url: "https://scrnshts.club/category/photo-and-video/ ",
          },
          {
            name: "Pexels Videos",
            url: "https://www.pexels.com/videos/ ",
          },
          {
            name: "Vecteezy Vid.",
            url: "https://www.vecteezy.com/free-videos ",
          },
        ],
      },
    ],
    faviconCache: {},
  }),

  actions: {
    loadFromLocalStorage() {
      try {
        const areasRaw = localStorage.getItem("areas");
        const faviconCacheRaw = localStorage.getItem("faviconCache");

        if (areasRaw) {
          const areasData = JSON.parse(areasRaw);
          if (Array.isArray(areasData)) {
            this.areas = areasData.map((area) => ({
              ...area,
              apps: Array.isArray(area.apps) ? area.apps : [],
            }));
          }
        }

        if (faviconCacheRaw) {
          const faviconData = JSON.parse(faviconCacheRaw);
          if (typeof faviconData === "object" && faviconData !== null) {
            this.faviconCache = faviconData;
          }
        }

        const resolveIcon = (app) => {
          try {
            const domain = new URL(app.url).hostname;
            app.icon =
              this.faviconCache[domain] ||
              `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          } catch (e) {
            /* ignore malformed urls */
          }
        };

        this.areas.forEach((area) => {
          (area.apps || []).forEach((item) => {
            if (isFolder(item)) {
              (item.apps || []).forEach(resolveIcon);
            } else {
              resolveIcon(item);
            }
          });
        });
      } catch (error) {
        console.error("localStorage'dan veri yüklenirken hata oluştu:", error);
        this.areas = [
          {
            label: "Main",
            background: "",
            apps: [],
          },
        ];
        this.faviconCache = {};
      }
    },

    saveToLocalStorage() {
      try {
        const safeAreas = Array.isArray(this.areas)
          ? this.areas.map((area) => ({
              ...area,
              apps: Array.isArray(area.apps) ? area.apps : [],
            }))
          : [
              {
                label: "Main",
                background: "",
                apps: [],
              },
            ];

        const safeFaviconCache =
          typeof this.faviconCache === "object" && this.faviconCache !== null
            ? this.faviconCache
            : {};

        localStorage.setItem("areas", JSON.stringify(safeAreas));
        localStorage.setItem("faviconCache", JSON.stringify(safeFaviconCache));
      } catch (error) {
        console.error("localStorage'a veri kaydedilirken hata oluştu:", error);
      }
    },

    // Serializable snapshot of all areas + shortcuts, for backup/export.
    exportData() {
      return {
        app: "hexpane",
        version: 1,
        areas: JSON.parse(JSON.stringify(this.areas)),
      };
    },

    // Replace all areas from an imported backup. Returns true on success.
    importData(data) {
      const areas = data && Array.isArray(data.areas) ? data.areas : null;
      if (!areas) return false;
      const valid = areas.every(
        (a) => a && typeof a.label === "string" && Array.isArray(a.apps)
      );
      if (!valid) return false;
      // normalize: keep only the fields we use, drop anything unexpected
      this.areas = areas.map((a) => ({
        label: a.label,
        background: typeof a.background === "string" ? a.background : "",
        apps: a.apps,
      }));
      this.saveToLocalStorage();
      return true;
    },

    addArea(newArea) {
      this.areas.push(newArea);
      this.saveToLocalStorage();
    },

    async addAppToArea(areaIndex, title, url) {
      function getValidURL(input) {
        if (!input) return null;
        if (!/^https?:\/\//i.test(input)) {
          input = "https://" + input.replace(/^\/+/, "");
        }
        try {
          return new URL(input);
        } catch (e) {
          return null;
        }
      }

      const validURL = getValidURL(url);
      if (!validURL) {
        alert("Lütfen geçerli bir URL girin (örneğin: google.com)");
        return;
      }

      const domain = validURL.hostname;

      if (
        !this.areas[areaIndex] ||
        !Array.isArray(this.areas[areaIndex].apps)
      ) {
        this.areas[areaIndex].apps = [];
      }

      // Use the favicon URL directly, exactly like the built-in shortcuts, so the
      // <img> loads it (cross-origin images need no CORS). The previous
      // fetch()+data-URL path failed under CORS and fell back to a generic globe
      // icon for every added shortcut.
      const iconData =
        this.faviconCache[domain] ||
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      this.areas[areaIndex].apps.push({
        name: title,
        url: validURL.toString(),
        icon: iconData,
      });

      this.saveToLocalStorage();
    },

    // --- Area editing ---
    updateArea(index, label) {
      if (!this.areas[index]) return;
      this.areas[index].label = label;
      this.saveToLocalStorage();
    },

    deleteArea(index) {
      if (this.areas.length <= 1) return; // keep at least one area
      this.areas.splice(index, 1);
      this.saveToLocalStorage();
    },

    // --- Folders ---
    // Drop the item at `fromIdx` onto the item at `toIdx`:
    // app→app creates a folder, app→folder adds to it.
    dropOnItem(areaIndex, fromIdx, toIdx) {
      const items = this.areas[areaIndex]?.apps;
      if (!items || fromIdx === toIdx) return;
      const dragged = items[fromIdx];
      const target = items[toIdx];
      if (!dragged || !target || isFolder(dragged)) return;

      if (isFolder(target)) {
        target.apps.push(dragged);
      } else {
        items[toIdx] = {
          type: "folder",
          name: "Klasör",
          apps: [target, dragged],
        };
      }
      items.splice(fromIdx, 1);
      this.saveToLocalStorage();
    },

    removeFromFolder(areaIndex, folderIdx, innerIdx) {
      const items = this.areas[areaIndex]?.apps;
      const folder = items?.[folderIdx];
      if (!isFolder(folder)) return;
      const [app] = folder.apps.splice(innerIdx, 1);
      if (app) items.push(app);
      // Dissolve a folder that holds one or zero apps
      if (folder.apps.length <= 1) {
        if (folder.apps.length === 1) items.push(folder.apps[0]);
        items.splice(folderIdx, 1);
      }
      this.saveToLocalStorage();
    },

    renameFolder(areaIndex, folderIdx, name) {
      const folder = this.areas[areaIndex]?.apps?.[folderIdx];
      if (!isFolder(folder)) return;
      folder.name = name;
      this.saveToLocalStorage();
    },

    reorderItem(areaIndex, fromIdx, toIdx) {
      const items = this.areas[areaIndex]?.apps;
      if (!items) return;
      arrayMove(items, fromIdx, toIdx);
      this.saveToLocalStorage();
    },

    removeItem(areaIndex, idx) {
      const items = this.areas[areaIndex]?.apps;
      if (!items || idx < 0 || idx >= items.length) return;
      items.splice(idx, 1);
      this.saveToLocalStorage();
    },

    updateItem(areaIndex, idx, { name, url } = {}) {
      const item = this.areas[areaIndex]?.apps?.[idx];
      if (!item || isFolder(item)) return;
      if (name != null) item.name = name;
      if (url != null) {
        const valid = normalizeUrl(url);
        if (valid) {
          const newHost = valid.hostname;
          const changed = newHost !== safeHost(item.url);
          item.url = valid.toString();
          if (changed) {
            item.icon =
              this.faviconCache[newHost] ||
              `https://www.google.com/s2/favicons?domain=${newHost}&sz=128`;
          }
        }
      }
      this.saveToLocalStorage();
    },

    moveItemToArea(fromArea, fromIdx, toArea) {
      if (fromArea === toArea) return;
      const src = this.areas[fromArea]?.apps;
      const dst = this.areas[toArea]?.apps;
      if (!src || !dst || fromIdx < 0 || fromIdx >= src.length) return;
      const [item] = src.splice(fromIdx, 1);
      dst.push(item);
      this.saveToLocalStorage();
    },

    reorderArea(fromIdx, toIdx) {
      arrayMove(this.areas, fromIdx, toIdx);
      this.saveToLocalStorage();
    },

    reorderInFolder(areaIndex, folderIdx, fromIdx, toIdx) {
      const folder = this.areas[areaIndex]?.apps?.[folderIdx];
      if (!isFolder(folder)) return;
      arrayMove(folder.apps, fromIdx, toIdx);
      this.saveToLocalStorage();
    },
  },
});
