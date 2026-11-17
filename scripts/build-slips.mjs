import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TOTAL = 57
const CHUNK = 500

const BAD =
  /酒|醉|楼顶|天台|翻越|尾随|跟踪|搭讪|要电话|要微信|外貌|身材|吓人|整蛊|裸|偷窃|闯红灯|偏僻|网贷|借钱|奢侈|假扮工作人员|谣言|危险|半夜出门|陌生人家里|翻墙|攀爬|药品|处方|加微信|http|www\./

function chars(text) {
  return Array.from(text).length
}

function balanced(text) {
  const open = (text.match(/「/g) ?? []).length
  const close = (text.match(/」/g) ?? []).length
  return open === close
}

function acceptable(slip) {
  const all = `${slip.verse}${slip.title}${slip.description}`
  if (!balanced(all)) return "括号不成对"
  if (BAD.test(all)) return "触及不宜"
  if (/的的|了了|在在|把把|给给|先先|吃吃|喝喝|undefined|null|\{|\}/.test(all)) return "语句别扭"
  if (
    /路朝|路沿|路绕着|轻声留|新闻名字|考古名字|默片名字|日记名字|天气预报名字|相声名字|菜谱名字|就夸把|拨出的十五分钟，|然后起一个|然后用一句话形容[^它]|然后在心里鞠躬|玩「用|雨或晴|下一个一声|用严肃口吻|用童话口吻|一小段，/.test(
      all,
    )
  ) {
    return "语句别扭"
  }
  if (chars(slip.title) < 6 || chars(slip.title) > 46) return "标题长短"
  if (chars(slip.description) < 16 || chars(slip.description) > 120) return "说明长短"
  if (!slip.description.includes("。")) return "说明不成句"
  if (chars(slip.verse) < 4 || chars(slip.verse) > 22) return "签语长短"
  if (/[A-Za-z]/.test(all)) return "夹了字母"
  return ""
}

function mulberry32(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(list, rng) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = list[index]
    list[index] = list[swap]
    list[swap] = current
  }
  return list
}

function hash(text) {
  let value = 2166136261
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function combos(slots, build) {
  const keys = Object.keys(slots)
  const out = []
  const walk = (index, acc) => {
    if (index === keys.length) {
      out.push(build(acc))
      return
    }
    const key = keys[index]
    for (const value of slots[key]) walk(index + 1, { ...acc, [key]: value })
  }
  walk(0, {})
  return out
}

const VERSE = {
  ritual: [
    "名字一出，寻常低头",
    "郑重一声，日子侧身",
    "叫过的事物，会记住你",
    "一口头衔，万般平常",
    "宣布之后，晚饭有了江湖",
    "封号很小，回声很大",
    "把今天叫醒",
    "寻常物，听得见自己的名字",
  ],
  rule: [
    "规则一弯，路就歪了",
    "这一小时，另有语法",
    "四字够用，世界变轻",
    "怪规则只活一小会儿",
    "按歪了的节拍走路",
    "自己跟自己签的约",
    "下一分钟可以重来",
    "不合常理，刚刚好",
  ],
  stranger: [
    "一句具体的好，比空话近",
    "夸到细节，人才被看见",
    "说完就走，余温还在",
    "轻轻的，才放得下",
    "柜台那边，会亮一下",
    "不留名字，留一句准",
    "善意要小，才好接住",
    "谢谢说得见物",
  ],
  secret: [
    "纸条不署名，角落会笑",
    "未来的你会拆开今天",
    "藏好，就算寄出",
    "一句好话，自己会走路",
    "匿名，是一种礼貌",
    "七天后的手会摸到",
    "不留地址，只留温度",
    "悄悄的，也算完成",
  ],
  explore: [
    "没走过的路，认得新脚步",
    "宝物不必带走",
    "拐一下，城市就开口",
    "熟悉之前，先陌生一会儿",
    "步数比地图诚实",
    "小街不在地图上",
    "走到熟悉处，就可以停",
    "偏航是今天的正文",
  ],
  role: [
    "身份借一会儿，记完就还",
    "地球人的认真，值得记录",
    "考察结束，恢复原样",
    "月亮今晚微服",
    "只观察，不打扰",
    "三件小事，就是报告",
    "扮演到门口为止",
    "外星人也要守规矩",
  ],
  create: [
    "三件东西，已经是展览",
    "名字比形状先到",
    "摆好，看一分钟",
    "说明牌让日常站直",
    "不买道具，用手边的",
    "小小的，也算建成",
    "归位之后，名字还在",
    "今天的博物馆只开一分钟",
  ],
  luck: [
    "下一个颜色，替你拿主意",
    "命运只负责小事",
    "红的那件，点了今晚",
    "听它一次，然后自己笑",
    "手势来了，就偏一下",
    "不合适，就向颜色道谢",
    "硬币比计划更会迷路",
    "这一下，不算吉凶",
  ],
  kindness: [
    "弯一次腰，路就轻一点",
    "具体的谢，最轻也最真",
    "放回原处，也是悄悄的好",
    "不必声张",
    "顺手的，才算这支签",
    "让下一个人省一步",
    "善意要能立刻做完",
    "做小一点，仍然算数",
  ],
  adventure: [
    "委托很小，做完即回",
    "秘密任务，公开安全",
    "找到就停，不必扩大",
    "城市把线索放得很低",
    "看一眼，就算抵达",
    "不进私人的门",
    "这单委托，免费",
    "回来时口袋里有一句",
  ],
  family: [
    "谁先笑，谁就赢一点",
    "指挥权只借三分钟",
    "家里也可以出城",
    "一个人，就分饰两角",
    "游戏结束，要说收工",
    "枕头城堡也算建成",
    "晚饭之前的一小场",
    "规则可笑，人才放松",
  ],
  food: [
    "先闻再咬，时间变厚",
    "这口有名字了",
    "仪式很小，味道会排队",
    "宣布之后再入口",
    "不赶，才吃得见",
    "剩菜也可以封神",
    "一小口，算一场",
    "热气是今天的路",
  ],
  sense: [
    "气味不排队，直接进记忆",
    "五个字，刚刚好",
    "闭上眼，世界换耳朵",
    "外号一出，味道就站住",
    "先闻，再决定要不要",
    "这一下，交给鼻子",
    "声音也要有名字",
    "手比眼睛先到",
  ],
  slow: [
    "慢到可笑，街景才说话",
    "这一小段不赶",
    "肩膀先到家",
    "允许只做一点点",
    "五分钟不被使用",
    "今天可以请假",
  ],
  city: [
    "门推开的一下，已经是旅行",
    "橱窗也算到过",
    "问一句，地图裂开",
    "早一站，路换了主人",
  ],
  home: [
    "屋里也有远方",
    "归位，是一种让",
    "这件东西今天值班",
  ],
}

const RANKS = ["上上签", "上签", "中签"]

function rankFor(n) {
  const slot = n % 10
  if (slot <= 3) return "上上签"
  if (slot <= 6) return "上签"
  return "中签"
}

function verseFor(category, title) {
  const bank = VERSE[category] ?? VERSE.ritual
  return bank[hash(title) % bank.length]
}

function durationFor(category, n) {
  if (category === "explore" || category === "adventure") return n % 3 === 0 ? 30 : 15
  if (category === "ritual") return n % 2 === 0 ? 15 : 5
  if (category === "sense" || category === "luck" || category === "stranger" || category === "kindness") {
    return 5
  }
  return 15
}

const jewels = [
  {
    "category": "music",
    "duration": 5,
    "verse": "第二首歌，替今天开门",
    "title": "闭眼听完歌单里的第二首歌",
    "description": "找一个安稳的位置坐下，闭上眼睛听完歌单里的第二首歌。听完记下脑海里出现的第一个画面。"
  },
  {
    "category": "sense",
    "duration": 15,
    "verse": "陌生的一杯，今天归你",
    "title": "点一杯从没点过的饮品",
    "description": "在自己的预算内，点一杯从没喝过的饮品。喝第一口前猜猜它是什么味道，喝完再给它打个分。"
  },
  {
    "category": "memory",
    "duration": 15,
    "verse": "旧照片里还有今天",
    "title": "翻看十年前今天的照片",
    "description": "找一张十年前今天拍的照片，认真看一会儿，写一句当时没说的话。找不到就翻同月前后几天。"
  },
  {
    "category": "city",
    "duration": 30,
    "verse": "两三站，也算偏航",
    "title": "坐一次没坐过的公交两三站",
    "description": "选一条没坐过的公交，先确认返程路线，再白天坐两三站。下车逛五分钟，想回家就按熟悉路线返回。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "十秒钟，谁先笑",
    "title": "和好朋友对视十秒不笑场",
    "description": "先问朋友愿不愿意玩。彼此看着对方十秒，不能笑场；笑了可以再来一次。"
  },
  {
    "category": "movement",
    "duration": 5,
    "verse": "五下之后，今天算数",
    "title": "做五个仰卧起坐",
    "description": "做五个仰卧起坐，完成后给自己鼓一次掌。身体不方便的话，改做五次轻松的伸展动作。"
  },
  {
    "category": "friend",
    "duration": 15,
    "verse": "三欧买来一阵凉快",
    "title": "请朋友吃一支小冰激凌",
    "description": "请身边一位朋友吃一支三欧左右的冰激凌。超出预算就让对方补差价；对方不想吃也没关系。"
  },
  {
    "category": "kindness",
    "duration": 15,
    "verse": "小小发夹，另找主人",
    "title": "买个新发夹送给用得上的朋友",
    "description": "挑一个预算内的小发夹。如果自己用不上，就问一位可能喜欢的朋友要不要；不合适就自己留着。"
  },
  {
    "category": "kindness",
    "duration": 5,
    "verse": "一句话，绕回家里",
    "title": "给妈妈发一句我爱你",
    "description": "给妈妈发一句「突然想告诉你，我爱你」。如果今天不方便联系，就把这句话写给一位让你安心的人。"
  },
  {
    "category": "stranger",
    "duration": 5,
    "verse": "白衣经过，送一句晴天",
    "title": "向穿白色衣服的人问声好",
    "description": "白天在公共场所，遇到一位穿白衣、看起来不忙的人，保持距离说「你好，今天是个美丽的日子」。不回应就微笑离开。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "十秒钟，留下今天的声音",
    "title": "请人帮你录十秒钟唱歌",
    "description": "遇到一位年龄相仿、穿白衣的异性，先问能否帮你录十秒。对方愿意再唱一句喜欢的歌；只录你自己，录完道谢。"
  },
  {
    "category": "create",
    "duration": 15,
    "verse": "一朵鸢尾，停住五分钟",
    "title": "和梵高的《鸢尾花》待五分钟",
    "description": "找一张梵高《鸢尾花》的画，选一朵最先吸引你的花，给它起个名字，再猜猜它此刻在想什么。"
  },
  {
    "category": "food",
    "duration": 60,
    "verse": "一餐饭，装着一点心意",
    "title": "亲手给喜欢的人做一餐饭",
    "description": "给喜欢的人认真做一道饭菜，可以简单但要亲手完成。送出前拍张照，记下做饭时的心情。"
  },
  {
    "category": "music",
    "duration": 15,
    "verse": "副歌学会，今天多一首",
    "title": "学唱一首新歌的副歌",
    "description": "选一首没学过的歌，跟着学会副歌。不要追求唱准，能从头唱到尾就算完成。"
  },
  {
    "category": "kindness",
    "duration": 15,
    "verse": "今天也值得一束花",
    "title": "买一束花送给自己",
    "description": "买一束预算内的花送给自己，不用等特别的日子。带回家后给它找个显眼的位置。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "一句台词，打开旧电影",
    "title": "模仿电影台词让朋友猜片名",
    "description": "挑一段你熟悉的电影经典台词，用原来的语气说给亲近的人听，让对方猜是哪部电影。猜错就揭晓答案。"
  },
  {
    "category": "rule",
    "duration": 5,
    "verse": "说一次不，也是在选择",
    "title": "对一件不愿意的事说不",
    "description": "遇到一件你不想答应的小事，平静地说「不，这次我不愿意」。不编理由，也不必解释；若当下不适合，就写下来。"
  },
  {
    "category": "kindness",
    "duration": 15,
    "verse": "留一点食物，也留点距离",
    "title": "给一只流浪猫放些猫粮和清水",
    "description": "在干净安全的地方给流浪猫放少量猫粮和清水。不要追赶或抱它，也不要喂牛奶；不适合投喂就联系动物救助。"
  },
  {
    "category": "kindness",
    "duration": 15,
    "verse": "先问一句，再伸出手",
    "title": "在医院问问老人是否需要帮忙",
    "description": "在医院遇到行动不便的老人，先问是否需要帮忙找服务台或诊室。对方同意后协助联系工作人员，病情和取药交给医护或家属。"
  },
  {
    "category": "book",
    "duration": 30,
    "verse": "十页之后，换个念头",
    "title": "认真读眼前第一本书的十页",
    "description": "拿起眼前第一本书，认真读满十页，不跳着看。读完记下最让你停顿的一句话。"
  },
  {
    "category": "photo",
    "duration": 5,
    "verse": "普通东西，主演今天",
    "title": "给普通东西拍一张电影海报",
    "description": "给杯子、树影或窗户拍一张电影海报风格的照片。只拍一张，再给这部电影起个名字。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "一首歌就够传信",
    "title": "给想到的第一个人发一首歌",
    "description": "挑一首歌发给脑海里第一个出现的人，只写「这首歌让我想到你」。不必解释，也不用等回复。"
  },
  {
    "category": "friend",
    "duration": 15,
    "verse": "一个问题，打开旧抽屉",
    "title": "问朋友一个以前没问过的问题",
    "description": "问一位朋友：「小时候最喜欢哪种声音？」听完后也分享自己的答案。"
  },
  {
    "category": "kindness",
    "duration": 5,
    "verse": "具体的谢，最容易记住",
    "title": "对正在做事的人说具体的谢谢",
    "description": "对一位正在帮你做事的人，说清楚你谢的是哪一件小事。没有合适时机就给熟人发条简短感谢。"
  },
  {
    "category": "food",
    "duration": 15,
    "verse": "新味道，只有一小口",
    "title": "买一种没吃过的小点心",
    "description": "选一种没吃过、看起来愿意尝试的小点心，买最小份就好。尝完用三个词形容味道。"
  },
  {
    "category": "city",
    "duration": 15,
    "verse": "提前一站，路就新了",
    "title": "提前一站下车走一条新路",
    "description": "在熟悉且安全的区域提前一站下车，沿明亮熟悉的路线走十分钟。出发前看好回程方式，累了就返回。"
  },
  {
    "category": "music",
    "duration": 5,
    "verse": "旧歌换了一双耳朵",
    "title": "听一首小时候熟悉的歌",
    "description": "找一首小时候常听的歌，听到结束。记下现在听它时最先想到的一个人或地方。"
  },
  {
    "category": "photo",
    "duration": 5,
    "verse": "光落下来，刚好被你看见",
    "title": "拍下今天最特别的一束光",
    "description": "拍一张今天偶然看见的光、影子或反光。给照片写四个字的标题，不用修图。"
  },
  {
    "category": "food",
    "duration": 15,
    "verse": "果肉里藏着新地图",
    "title": "尝一种没吃过的水果",
    "description": "买一小份从没吃过的水果，或找一种自己很少吃的水果。尝一口，用三个词描述它。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "天空替你打了个招呼",
    "title": "把今天的天空发给一位朋友",
    "description": "拍下此刻的天空，发给一位朋友，只配一句「这片天刚刚看见你」。"
  },
  {
    "category": "city",
    "duration": 15,
    "verse": "门里有一小段新鲜",
    "title": "进一家从没进去过的小店看看",
    "description": "走进附近一家从没进去过的小店，看看最吸引你的东西。不需要购买，观察一分钟就可以离开。"
  },
  {
    "category": "ritual",
    "duration": 5,
    "verse": "杯子获得临时身份",
    "title": "给今天的水杯起个临时名字",
    "description": "给手边的杯子起个名字，比如「今日补给站」，举杯喝三口。名字只在今天有效。"
  },
  {
    "category": "create",
    "duration": 15,
    "verse": "三样东西，也能开幕",
    "title": "用三样东西摆一个小展览",
    "description": "用手边三样东西摆一个小展览，给它们起个展览名，拍一张照片后放回原处。"
  },
  {
    "category": "memory",
    "duration": 5,
    "verse": "旧时光收到一封信",
    "title": "给十年前的自己留一句话",
    "description": "翻一张十年前的照片，给照片里的自己写一句现在想说的话。找不到旧照片，就写给十年前的自己。"
  },
  {
    "category": "music",
    "duration": 15,
    "verse": "今天的片头曲已选好",
    "title": "和朋友互相选一首今天的主题曲",
    "description": "你和朋友各选一首歌当今天的主题曲，互相分享。听完其中一首就完成。"
  },
  {
    "category": "luck",
    "duration": 5,
    "verse": "硬币只管小小一件事",
    "title": "让硬币替你选一件小事",
    "description": "抛硬币决定今天喝热饮还是冷饮，或走哪条熟悉的路。结果不合适就按自己的想法来。"
  },
  {
    "category": "home",
    "duration": 5,
    "verse": "漂泊物终于靠岸",
    "title": "把一件总漂泊的东西送回原位",
    "description": "挑一件总在桌面或椅子上漂泊的东西，把它放回合适的位置。完成后对它说「到站了」。"
  },
  {
    "category": "city",
    "duration": 15,
    "verse": "长椅借你三分钟",
    "title": "去附近找一张没坐过的长椅",
    "description": "白天找一张干净安全的长椅坐三分钟。看看周围，记下一件之前没注意到的事。"
  },
  {
    "category": "photo",
    "duration": 5,
    "verse": "旧照片，新标题",
    "title": "给一张旧照片重新起个标题",
    "description": "从相册里挑一张旧照片，给它起一个今天才想到的新标题。不必发给别人。"
  },
  {
    "category": "food",
    "duration": 15,
    "verse": "颜色先替你做决定",
    "title": "点一杯颜色不像你会选的饮品",
    "description": "在预算内点一杯颜色不像你平时会选的饮品。第一口前猜味道，再看看猜得准不准。"
  },
  {
    "category": "adventure",
    "duration": 15,
    "verse": "五分钟，足够偏离",
    "title": "在熟悉街区走一条平时不走的路",
    "description": "白天在熟悉的街区选一条平时不走的安全路线，走五分钟后折返。"
  },
  {
    "category": "kindness",
    "duration": 5,
    "verse": "纸条先替你开口",
    "title": "给身边的人留一句具体夸奖",
    "description": "给家人或朋友写一句具体的夸奖，放在对方会看到的地方，或方便时发给对方。"
  },
  {
    "category": "memory",
    "duration": 5,
    "verse": "一周后的你会拆信",
    "title": "给一周后的自己留一句话",
    "description": "写一句话给七天后的自己，放进备忘录并设一个提醒。只写一句，不安排待办。"
  },
  {
    "category": "kindness",
    "duration": 5,
    "verse": "归位也是小小善意",
    "title": "把一件共用的东西放回原位",
    "description": "把身边一件大家共用的东西放回原位，比如购物篮、椅子或书。只整理这一件就好。"
  },
  {
    "category": "nature",
    "duration": 15,
    "verse": "落叶也有自己的名字",
    "title": "找一片已经落下的叶子",
    "description": "在散步时找一片已经落下的叶子，观察它的形状和颜色，不要摘树上的叶子。给它起个名字。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "一句歌，借来一分钟",
    "title": "问朋友借一分钟听你唱歌",
    "description": "问一位熟悉的朋友愿不愿意听你唱一句歌。对方愿意再唱，不方便就改天。"
  },
  {
    "category": "stranger",
    "duration": 15,
    "verse": "别人的答案，是新线索",
    "title": "问店员今天最受欢迎的饮品",
    "description": "在店里不忙的时候问店员今天哪款饮品最受欢迎。听完道谢，预算合适再决定要不要点。"
  },
  {
    "category": "movement",
    "duration": 5,
    "verse": "脚尖短暂看见屋顶",
    "title": "做十次踮脚再慢慢放下",
    "description": "扶着稳固的桌沿或墙，踮脚十次再慢慢放下。若不舒服，就坐着活动脚踝十次。"
  },
  {
    "category": "friend",
    "duration": 15,
    "verse": "十分钟，聊点路上的事",
    "title": "邀请朋友一起散步十分钟",
    "description": "给一位朋友发消息，问对方愿不愿意一起散步十分钟。对方没空，就自己走一段平时少走的路。"
  },
  {
    "category": "sense",
    "duration": 5,
    "verse": "耳朵先出门散步",
    "title": "闭眼听一会儿窗外的声音",
    "description": "在安稳的地方坐下，闭眼听三十秒，睁眼后写下最先听见的两种声音。"
  },
  {
    "category": "family",
    "duration": 15,
    "verse": "旧愿望又被提起",
    "title": "问家人小时候最想做什么",
    "description": "找一位家人问：「你小时候最想做什么？」认真听完，再说说你小时候的愿望。"
  },
  {
    "category": "create",
    "duration": 15,
    "verse": "一件小事，留在纸上",
    "title": "把今天的一件小事画下来",
    "description": "用一分钟画下今天刚发生的一件小事，不用画得像。给这张画起个标题。"
  },
  {
    "category": "food",
    "duration": 15,
    "verse": "冰箱里也有新组合",
    "title": "用家里现有食材做一道新搭配",
    "description": "只用家里现有的食材，试着做一道没搭配过的小吃。先少做一点，给它起个名字。"
  },
  {
    "category": "city",
    "duration": 30,
    "verse": "陌生一站，半日偏航",
    "title": "坐最近一趟火车去陌生一站",
    "description": "不提前挑目的地，坐最近一趟白天出发的火车，在一站没去过的地方下车逛一会儿。出发前确认预算和返程班次。"
  },
  {
    "category": "friend",
    "duration": 5,
    "verse": "一句话，把日常拐弯",
    "title": "对熟悉的人说一句没头没尾的话",
    "description": "找个轻松时刻对熟悉的人说：「我刚才突然想起你。」说完停一下，听听对方怎么回应。"
  },
  {
    "category": "book",
    "duration": 15,
    "verse": "第一页，借来一段路",
    "title": "在书店随机读一本书的第一页",
    "description": "进一家书店，挑一本从没看过的书，只读第一页。把最喜欢的一句话记下来，然后放回去。"
  },
  {
    "category": "kindness",
    "duration": 15,
    "verse": "一餐饭，装着一点心意",
    "title": "给喜欢的人准备一道简单的菜",
    "description": "给喜欢的人亲手做一道简单的菜，不必铺张。送出前拍张照片，记下当时的心情。"
  }
]

const frames = []

frames.push({
  category: "ritual",
  items: combos(
    {
      object: [
        "今天的晚饭",
        "手里的杯子",
        "窗外那朵云",
        "门口那双鞋",
        "桌上的钥匙",
        "今天的风",
        "包里的伞",
        "刚洗好的碗",
        "窗台的花",
        "今晚的月亮",
        "路上的影子",
        "口袋里的硬币",
        "刚买的面包",
        "等车的这几分钟",
        "厨房的香气",
        "今天的光",
        "你坐的椅子",
        "楼道的回声",
        "那盏路灯",
        "今天的天色",
        "手里的笔",
        "冰箱里的剩菜",
        "阳台的衣服",
        "这一页空白",
        "耳机里的歌",
        "路口的红灯",
        "刚泡的茶",
        "晚饭的碗",
        "窗边那只鸟",
        "口袋里的收据",
        "今天的自己",
        "这段楼梯",
        "你的背包",
        "今晚的枕头",
        "这页日历",
        "牙刷杯",
        "水龙头",
        "这条围巾",
        "楼下的信箱",
        "你的脚步",
      ],
      style: [
        "武侠小说",
        "仙侠话本",
        "童话",
        "评书",
        "侦探小说",
        "航海日志",
        "科幻小说",
        "志怪故事",
        "舞台剧",
        "睡前故事",
        "民间传说",
        "寓言",
        "古诗",
        "游记",
        "旧书信",
        "相声",
        "菜谱",
        "天气预报",
        "考古报告",
        "新闻播报",
        "戏曲",
        "默片",
        "星际日志",
      ],
    },
    ({ object, style }) => ({
      category: "ritual",
      title: `用${style}的口气，给${object}起名，并郑重宣布`,
      description: `名字要具体，最好带上器物或天气。只宣布一次，声音可大可小。对自己说也算，不必叫人围观。`,
    }),
  ),
})

frames.push({
  category: "rule",
  items: combos(
    {
      window: [
        "在接下来的一小时里",
        "在接下来的二十分钟里",
        "晚饭开始之前",
        "今天日落之前",
        "下一次出门的路上",
        "在你拨出的十五分钟里",
        "在这支签之后的一小段时间里",
        "喝完下一杯之前",
        "听完三首歌之前",
        "灯还亮着的时候",
        "回到家门口之前",
        "在下一趟短短的通勤里",
        "买完下一件小东西之前",
        "在今天结束之前",
        "在坐下之前的那段路上",
      ],
      constraint: [
        "说话只用四个字",
        "每句话都带一种颜色",
        "把「然后」说成「忽然」",
        "开口前先在心里鞠躬",
        "只用问句跟自己说话",
        "看见圆形就在心里鼓掌",
        "看见红色就点一下头",
        "给经过的每扇门起个临时名字",
        "走路时哼一段没有歌词的调",
        "把谢谢说成一件具体的小事",
        "做完一个小动作就在心里说好",
        "把今天叫作远客来的一天",
        "回答自己之前先说天气",
        "只用左手拿起小东西",
        "把叹气换成轻轻吹一口气",
        "看见云就给它起小名",
        "把「我要」换成「我邀请」",
        "给听到的第一种声音起外号",
        "把普通的门叫作关卡",
        "每走十步就看一次天空",
        "把杯子举到光里再喝",
        "说话时带一个食物的比喻",
        "给此刻起一个时间的别名",
        "假装每件小东西都在值班",
        "把「快点」从心里删掉",
        "看见字就只读四个字",
        "给自己的步伐配一个鼓点",
        "把背包看成小小的飞船",
        "把每扇窗当画，只看两秒",
        "把钥匙叫作今日令牌",
        "对鞋子说一句辛苦了",
        "把等待当成收集声音",
        "用四个字给心情起名",
        "看见鸟或植物就在心里问好",
        "把抱怨翻译成一句夸张的诗",
        "给影子安排一个座位",
      ],
    },
    ({ window, constraint }) => ({
      category: "rule",
      title: `${window}，${constraint}`,
      description: `这条规则只约束你自己：${constraint}。做不到就笑一下，从下一分钟重来，不必解释，也不必坚持到不舒服。`,
    }),
  ),
})

frames.push({
  category: "stranger",
  items: combos(
    {
      person: [
        "店员",
        "收银的人",
        "面包店里的人",
        "花店里的人",
        "书店店员",
        "咖啡店里的人",
        "药店里的人",
        "超市里理货的人",
        "水果摊的人",
        "邮局里的人",
        "打印店里的人",
        "菜场里的人",
        "车站里答问的人",
        "前台的人",
        "花摊边的人",
        "文具店里的人",
      ],
      detail: [
        "做事时的耐心",
        "东西摆得很齐的样子",
        "说话清楚、又不催人",
        "给别人留出的那一点空",
        "擦得发亮的柜台",
        "回答小问题时的认真",
        "递袋子时稳稳的手势",
        "收拾整齐的门口",
        "写得工整的价签",
        "轻声说谢谢的样子",
        "放得很稳的找零",
        "让人不用大声的音量",
        "随手把东西归位的习惯",
        "窗边那盆被照顾的植物",
        "工作服上一个很小的饰物",
        "招呼队伍时的从容",
        "折得很整齐的包装角",
        "提醒小心烫时的轻声",
        "放得很轻的店里音乐",
        "放得很正的门口垫子",
      ],
    },
    ({ person, detail }) => ({
      category: "stranger",
      title: `轻轻夸一位${person}，就夸${detail}`,
      description: `说一句具体的、让人舒服的话，夸的是事情，不是长相。说完道谢离开，不问姓名，不留任何联系方式。`,
    }),
  ),
})

frames.push({
  category: "secret",
  items: combos(
    {
      place: [
        "书店的读者墙",
        "咖啡馆留言板",
        "社区布告栏边角",
        "图书馆的便签墙",
        "电梯便民贴旁边",
        "自习室公共桌角",
        "社区活动室门口",
        "允许留言的小黑板",
        "公园告示栏边角",
        "公寓大堂公告栏",
        "共享书桌的一角",
        "面包店的留言夹里",
        "美术馆的意见簿",
        "车站便民栏上",
        "校园布告栏边角",
        "社区厨房的留言处",
        "书店楼梯口的墙上",
        "咖啡馆窗台的卡片盒里",
        "公共休息室的软木板",
        "展览说明旁的便签条",
      ],
      line: [
        "今天的你已经很好",
        "你走过的路都算数",
        "有人悄悄为你高兴",
        "慢慢来也算到达",
        "谢谢你把日子过得认真",
        "你比自己以为的更温柔",
        "世界今天偏爱你一点点",
        "你的小认真被看见了",
        "允许自己歇一会儿",
        "今天不必完美",
        "有人把好运分你一点",
        "这页日子写得不错",
        "谢谢你没有放下今天",
        "你已经足够好了",
        "把温柔留给刚好需要的人",
        "今天的风站在你这边",
        "你做的小事有人受益",
        "愿你遇见一盏不刺眼的灯",
        "你值得一杯热的",
        "路还在，你也在",
        "谢谢你让公共的地方舒服一点",
        "今天可以只做一点点",
        "你不是一个人在过今天",
        "你已经很努力了",
        "愿下一顿饭热气腾腾",
        "这里借你一点好运",
        "辛苦了，仍然值得",
        "把这句话送给刚好抬头的人",
      ],
    },
    ({ place, line }) => ({
      category: "secret",
      title: `在${place}留一张匿名纸条：「${line}」`,
      description: `不署名，不留联系方式，不挡住别人要看的通知。纸条放在抬眼能看见的地方，写完就走，不必等谁捡到。`,
    }),
  ),
})

frames.push({
  category: "explore",
  items: combos(
    {
      way: [
        "走路回家",
        "走路去买菜",
        "出门散一会儿步",
        "一直走到车站",
        "朝着公园走",
        "先朝面包店走，再回头",
        "朝着邮局走",
        "朝着有水的地方走",
        "朝着树多的地方走",
        "朝着更安静的地方走",
        "沿着有店的一侧走",
        "沿着安静的一侧走",
        "绕这个街区走一圈",
        "走到下一个陌生路口就停",
        "先去看一扇橱窗，再折返",
        "改走对面的一侧",
      ],
      treasure: [
        "一块好看的砖",
        "一句有趣的招牌",
        "一扇从没注意的门",
        "一株从缝里长出的小植物",
        "一种说不清的气味",
        "一个圆形的物件",
        "一盏先亮起来的灯",
        "一面有纹路的墙",
        "一个清楚的倒影",
        "一片形状奇怪的叶子",
        "一个被放得很整齐的角落",
        "一种占了上风的颜色",
        "一颗可以当宝物的小石子",
        "一扇反光的窗",
        "一段好听的环境声",
        "一个安全的新方向",
        "一只不怕人的鸟或它的影子",
        "一块被磨亮的地面",
        "四个可以当诗的字",
        "一个让你想微笑的细节",
      ],
    },
    ({ way, treasure }) => ({
      category: "explore",
      title: `今天换一条路，${way}，找到「${treasure}」`,
      description: `宝物不必带走，看清它，在心里或纸上登记一句。只走安全的路，走到熟悉的地方就可以结束。`,
    }),
  ),
})

frames.push({
  category: "role",
  items: combos(
    {
      role: [
        "来地球考察的外星人",
        "迷路的时间旅客",
        "微服私访的月亮",
        "收集笑声的实习生",
        "第一次进城的云",
        "给门牌拍照的星使",
        "味道部门的外星职员",
        "影子研究所的学员",
        "温柔局的实习探员",
        "不会着急的星际邮差",
        "负责给城市起小名的人",
        "钥匙的远房朋友",
        "傍晚班的见习风",
        "只收集好事的间谍",
      ],
      behavior: [
        "奇怪的人类行为",
        "人类对杯子的郑重其事",
        "人类等待时的小动作",
        "人类和植物相处的样子",
        "人类给东西起名字的瞬间",
        "人类排队时的礼貌",
        "人类看一眼屏幕又放下",
        "人类对天气的感叹",
        "人类把包放在身侧的习惯",
        "人类遇见动物时的表情",
        "人类买面包时的犹豫",
        "人类过马路前的张望",
        "人类说谢谢的各种说法",
        "人类整理桌面的小仪式",
        "人类听歌时的脚步",
        "人类在窗边发呆的姿势",
      ],
    },
    ({ role, behavior }) => ({
      category: "role",
      title: `假装自己是${role}，记录三件${behavior}`,
      description: `写在纸上或备忘录里，只观察，不打扰，不拍摄别人的脸。记完就交还身份，不必表演给陌生人看。`,
    }),
  ),
})

const sculptureItems = [
  "杯子",
  "钥匙",
  "勺子",
  "书",
  "硬币",
  "笔",
  "瓶盖",
  "发卡",
  "橡皮",
  "筷子",
  "纸巾",
  "叶子",
  "石子",
  "夹子",
  "耳机",
  "信封",
  "便签",
  "玩偶",
  "眼镜盒",
  "充电线",
]
const sculptureNames = [
  "山雨欲来",
  "今日不宜赶",
  "慢速起飞",
  "一口江湖",
  "临时神仙",
  "小小远方",
  "安静的怪",
  "晚饭之前",
  "三件同盟",
  "桌面山脉",
  "未命名星",
  "钥匙会议",
  "软软的碑",
  "片刻纪念",
  "反向生长",
  "口袋气象",
  "无用之美",
  "今晚的船",
  "侧耳倾听",
  "刚好路过",
]
const sculptures = []
for (let i = 0; i < sculptureItems.length; i += 1) {
  for (let j = i + 1; j < sculptureItems.length; j += 1) {
    for (let k = j + 1; k < sculptureItems.length; k += 1) {
      const name = sculptureNames[(i * 7 + j * 3 + k) % sculptureNames.length]
      sculptures.push({
        category: "create",
        title: `用${sculptureItems[i]}、${sculptureItems[j]}和${sculptureItems[k]}摆一个小雕塑，起名叫「${name}」`,
        description: `就用手边这三样，不另外买。摆好看一分钟，把名字念出来，然后各自归位。`,
      })
    }
  }
}
frames.push({ category: "create", items: sculptures })

frames.push({
  category: "luck",
  items: combos(
    {
      color: ["红色", "黄色", "蓝色", "绿色", "白色", "橙色", "粉色", "紫色", "金色", "黑色"],
      decision: [
        "晚饭加不加一把家里有的葱",
        "下一杯喝热的还是常温的",
        "回家先往左还是先往右",
        "先出门五分钟还是先坐下",
        "晚饭加不加一种家里有的香料",
        "第一首歌听旧的还是随便一首",
        "哪只杯子当今晚的主角",
        "在窗边站一会儿还是换个座位",
        "先洗碗还是先发一会儿呆",
        "先给今天起名还是先给晚饭起名",
        "先写一句还是先走二十步",
        "把灯调亮一点还是调暗一点",
        "先跟家人说一句还是先安静一会儿",
        "吃一点水果还是喝一杯水",
        "用左手还是右手开下一扇门",
        "看过天再决定带不带伞",
        "先理口袋还是先喝水",
        "给植物转个面还是自己转个身",
        "走路看招牌还是看天空",
        "手机扣五分钟还是十分钟",
      ],
    },
    ({ color, decision }) => ({
      category: "luck",
      title: `让下一个${color}的东西替你拿主意：${decision}`,
      description: `让这个颜色只决定一件免费、马上能做的小事。若结果不合适，就在心里向${color}道谢，改由你自己选。`,
    }),
  ),
})

frames.push({
  category: "family",
  items: combos(
    {
      game: [
        "四字对话",
        "枕头城堡",
        "闭眼摸物",
        "晚饭武侠投票",
        "找圆形大赛",
        "改两个字唱歌",
        "三句故事会",
        "三分钟指挥权",
        "植物新闻发布会",
        "勺子话筒采访",
        "影子赛跑",
        "抱枕默剧",
        "椅子生日会",
        "地板旅行",
        "今日发现交换",
        "云和灯光投票",
        "家务关卡",
        "锅盖奖杯合影",
        "冰箱口音秀",
        "袜子里的故事",
      ],
      twist: [
        "结束时互相鞠一个很小的躬",
        "只用四个字宣布结果",
        "最后给这场游戏起标题",
        "中途夸对方一个具体细节",
        "用厨房里的东西当奖杯",
        "结束时一起看窗外十秒",
        "谁先笑谁获得一个临时头衔",
        "把过程画成三个圈",
        "做完把结果藏进纸条",
        "从开始到结束都不看手机",
        "结束时给对方倒一杯水",
        "用哼唱代替鼓掌",
      ],
    },
    ({ game, twist }) => ({
      category: "family",
      title: `和家人玩「${game}」，${twist}`,
      description: `没有家人就一人分饰两角，或把规则玩给空气看。做完说一声收工。只玩得小、玩得安全，不必拍照。`,
    }),
  ),
})

frames.push({
  category: "create",
  items: combos(
    {
      object: [
        "你的杯子",
        "一串钥匙",
        "今天的鞋",
        "这把椅子",
        "那盏灯",
        "冰箱门",
        "一把伞",
        "枕头",
        "这页日历",
        "窗台",
        "牙刷杯",
        "门把手",
        "背包",
        "耳机",
        "手边的书",
        "手机壳",
        "玄关",
        "餐桌",
        "那盆植物",
        "遥控器",
        "这条围巾",
        "水杯盖",
        "闹钟",
        "一只袜子",
        "水龙头",
        "镜子",
        "窗帘",
        "砧板",
        "信箱钥匙",
        "今天的包",
      ],
      tone: [
        "严肃的口吻",
        "童话的口吻",
        "侦探的口吻",
        "菜谱的口吻",
        "航海日志的口吻",
        "短短两句诗",
        "新闻播报的口吻",
        "武侠旁白的口吻",
        "说明书的口吻",
        "睡前故事的口吻",
        "考古报告的口吻",
        "天气预报的口吻",
        "舞台报幕的口吻",
        "日记的口吻",
        "星际日志的口吻",
        "评书的口吻",
      ],
    },
    ({ object, tone }) => ({
      category: "create",
      title: `用${tone}，为${object}写一张博物馆说明牌`,
      description: `两三句就够，写在纸上。写完念出来，好像它真的被展览了一分钟，然后把纸收好或留下。`,
    }),
  ),
})

frames.push({
  category: "adventure",
  items: combos(
    {
      place: [
        "旧书店门口",
        "面包店橱窗前",
        "公交站旁",
        "菜市场口",
        "公园长椅边",
        "楼下转角",
        "桥上",
        "超市冷门货架",
        "小区里少去的一角",
        "图书馆门外",
        "花店窗前",
        "河岸或湖边",
        "地铁出口",
        "咖啡馆窗外",
        "街角树下",
        "天桥上",
        "邮局附近",
        "社区花园",
        "药房橱窗外",
        "没走过的巷口",
      ],
      clue: [
        "一件叫不出名的小东西",
        "一句有趣的字",
        "一种今天的气味",
        "一扇没注意的门",
        "一个圆形物件",
        "一种绿色",
        "一个清楚的倒影",
        "一株努力的小植物",
        "一块特别的颜色",
        "一件摆得特别整齐的东西",
        "一面有纹路的墙",
        "一盏提前亮的灯",
        "一条墙缝里的绿",
        "一个安全的新方向",
        "一段重复的声音",
        "一个让人微笑的小细节",
      ],
      finale: [
        "在心里向它鞠一躬",
        "用一句话形容它",
        "为它拍一张没有人脸的照片",
        "给它起一个临时名字",
        "回家把它写下来",
        "对它说一声辛苦了",
        "用四个字给它封号",
        "把这件事告诉家人一句",
      ],
    },
    ({ place, clue, finale }) => ({
      category: "adventure",
      title: `秘密委托：在${place}找到${clue}，然后${finale}`,
      description: `委托很小，做完即可。不进入私人地方，不打扰别人，不花钱也算完成。找不到就换成最接近的一件。`,
    }),
  ),
})

frames.push({
  category: "luck",
  items: combos(
    {
      method: [
        "抛一枚硬币",
        "随便翻开一页，看单双",
        "看钟上的分钟是单是双",
        "听门外的声音偏左还是偏右",
        "闭眼从纸上两个词里指一个",
        "看下一扇门是开着还是关着",
        "用另一只手抽一张便签",
        "看窗外第一样会动的东西",
        "问家人二选一",
        "看下一辆车偏亮还是偏暗",
      ],
      stake: [
        "今晚家常饭的一个小选择",
        "下一杯喝什么",
        "散步时第一个转弯",
        "先做哪件五分钟的小事",
        "给谁发一句不长的问候",
        "今晚歌单的第一首",
        "哪只杯子当主角",
        "窗边站左边还是右边",
        "先出门还是先坐下",
        "灯亮一点还是暗一点",
        "先写字还是先走路",
        "把伞带上还是再看一次天",
        "先喝水还是先整理口袋",
        "给植物转面还是自己转身",
        "看招牌还是看天空",
        "手机扣五分钟还是十分钟",
      ],
    },
    ({ method, stake }) => ({
      category: "luck",
      title: `玩一次小小的命运：${method}，只让它决定${stake}`,
      description: `只把结果用在免费、马上能做的小事上。若你不喜欢那个结果，就向这次命运道谢，改由自己选，也算玩过。`,
    }),
  ),
})

const kindnessEnding = [
  "不必停留",
  "在心里记一笔",
  "对自己笑一下",
  "去喝一口水",
  "把这件事写成一句",
  "抬头看看天",
  "接着做自己的事",
  "不必告诉别人",
]
const kindnessDesc =
  "只做安全、顺手、不让对方为难的那一下。没有机会，就换成给家人或自己的最小版本，同样算完成。"
frames.push({
  category: "kindness",
  items: [
    ...combos(
      {
        place: ["店里", "车站里", "路上", "公园里", "菜场里", "咖啡馆里", "超市里", "图书馆门口"],
        act: [
          "对正在做事的人说一句具体的谢谢",
          "为后面的人扶一下门",
          "把公共椅子或推车归位",
          "捡起一小片安全的纸屑",
          "对辛苦的人说一声辛苦了",
          "把位子让给更赶时间的人",
          "给赶时间的人让出一个身位",
          "把柜台上落下的笔递回去",
          "向店员请教一件自己不知道的小事",
          "带走自己掉下的那一小片纸",
          "为下一个人把门多留一秒",
          "把挡路的公共伞收向一边",
        ],
        ending: kindnessEnding,
      },
      ({ place, act, ending }) => ({
        category: "kindness",
        title: `在${place}，${act}，然后${ending}`,
        description: kindnessDesc,
      }),
    ),
    ...combos(
      {
        act: [
          "给家里的植物浇一点水",
          "把用完的东西放回原处",
          "给同住的人留一张今天的便签",
          "把挡路的小东西轻轻挪开",
          "给家人倒一杯水",
          "把歪了的垫子铺正",
          "给很久没联系的人只发一句忽然想到你",
          "给下一个使用者留出干净的一角",
          "把玄关的鞋摆成可以进门的样子",
          "给家人的杯子倒上水",
        ],
        ending: kindnessEnding,
      },
      ({ act, ending }) => ({
        category: "kindness",
        title: `${act}，${ending}`,
        description: kindnessDesc,
      }),
    ),
  ],
})

const foodSteps = [
  "闻三秒",
  "看它的颜色",
  "对它说一句欢迎",
  "用非惯用手拿起",
  "在心里给它配乐",
  "看它在光里的样子",
  "把盘子或杯子转一下",
  "闭眼再尝很小一口",
  "说它像哪种天气",
  "给它鞠一个很小的躬",
]
frames.push({
  category: "food",
  items: [
    ...combos(
      {
        food: [
          "一瓣橘子",
          "一片面包",
          "一口米饭",
          "一块家里的点心",
          "一根黄瓜",
          "一颗葡萄",
          "一块饼干",
          "一勺酸奶",
          "今晚的第一口菜",
          "一块苹果",
          "一小把坚果",
          "一个西红柿",
          "一口面条",
          "一小块巧克力",
          "几颗花生",
          "一颗枣",
          "剩下的半份点心",
          "一碟小菜",
          "早上的第一口",
          "一片你常忽略的配菜",
        ],
        step: foodSteps,
      },
      ({ food, step }) => ({
        category: "food",
        title: `把${food}吃成小仪式：先${step}，再给它起名`,
        description: "用家里已有的，不额外买。名字四个字左右。吃的时候放下手机，吃完用一句话记下余味。",
      }),
    ),
    ...combos(
      {
        food: ["一杯茶", "一小杯热饮", "一碗汤", "一杯白水", "早上的第一口热饮"],
        step: foodSteps,
      },
      ({ food, step }) => ({
        category: "food",
        title: `把${food}喝成小仪式：先${step}，再给它起名`,
        description: "用家里已有的，不额外买。名字四个字左右。喝的时候放下手机，喝完用一句话记下余味。",
      }),
    ),
  ],
})

frames.push({
  category: "role",
  items: combos(
    {
      role: [
        "来地球考察的外星人",
        "微服的月亮",
        "迷路的诗人",
        "收集门的人",
        "味道侦探",
        "影子研究员",
        "第一次进城的风",
        "给城市起小名的人",
        "时间旅客",
        "只收集好事的间谍",
        "云的实习生",
        "不会着急的旅人",
        "见习邮差",
        "钥匙的朋友",
      ],
      mission: [
        "记下三件人类的郑重其事",
        "给三扇门起名字但不说出口",
        "找到一个可当宝物的小东西",
        "收集三种声音",
        "找一句能当诗的招牌",
        "观察人们等待的样子",
        "给沿路的树点名",
        "找一个倒影",
        "用四个字描述天空",
        "在没站过的安全空地站十秒",
        "给这条街起今天的别名",
        "找出占上风的颜色",
        "看一家没进过的店的橱窗",
        "数出三种圆形",
        "找一个让人想微笑的细节",
        "把这段路走成电影片头",
        "在心里向一盏灯报到",
        "记下一种食物的香气",
      ],
    },
    ({ role, mission }) => ({
      category: "role",
      title: `以「${role}」的身份走十分钟，任务是${mission}`,
      description: `身份只借十分钟。走安全的路，不打扰陌生人，不拍别人的脸。任务完成或时间到了，就把身份还回去。`,
    }),
  ),
})

frames.push({
  category: "secret",
  items: combos(
    {
      when: [
        "七天后的自己",
        "明天早上的自己",
        "下个雨天的自己",
        "下周的自己",
        "一个忙乱日子的自己",
        "月底的自己",
        "下个周一的自己",
        "今晚睡前的自己",
        "下次出门前的自己",
        "冬天的自己",
        "下一次旅行前的自己",
        "下个晴天的自己",
      ],
      hide: [
        "一本书里",
        "日历旁边",
        "杯子下面",
        "鞋盒里",
        "冰箱侧门",
        "枕头下",
        "镜子边",
        "外套口袋",
        "包的夹层",
        "花盆旁",
        "键盘下面",
        "常用抽屉",
      ],
      kind: [
        "一件今天的小事",
        "一句轻的鼓励",
        "一个荒谬的名字",
        "一句只有你懂的笑话",
        "一个想再做的小动作",
        "今天的天气和心情",
        "一句谢谢自己",
        "一个很轻的心愿",
      ],
    },
    ({ when, hide, kind }) => ({
      category: "secret",
      title: `写给${when}：藏在${hide}，写下${kind}`,
      description: `一两句就够。藏好之后就忘掉它，让未来的自己遇见。不必拍下来，也不必现在就读第二遍。`,
    }),
  ),
})

frames.push({
  category: "ritual",
  items: combos(
    {
      thing: [
        "今天的晚饭",
        "你的钥匙",
        "这双鞋",
        "外面的风",
        "今天的自己",
        "手里的杯子",
        "背包",
        "这把椅子",
        "窗外的树",
        "今天的光",
        "冰箱",
        "雨伞",
        "日历",
        "耳机",
        "枕头",
        "大门",
        "楼梯",
        "今天的影子",
        "口袋里的硬币",
        "那盆植物",
        "水龙头",
        "今天的歌",
        "路灯",
        "面包",
        "那朵云",
        "信箱",
        "你的脚步",
        "这条围巾",
        "这只碗",
        "今天的运气",
      ],
      occasion: [
        "晚饭桌上",
        "洗手的时候",
        "出门前",
        "关灯前",
        "泡茶时",
        "等电梯时",
        "打开门锁时",
        "坐下来的第一分钟",
        "下次看见它的时候",
        "把东西放回原位时",
        "窗边站着时",
        "收拾包的时候",
        "拉开椅子时",
        "喝第一口水时",
        "看手机之前",
        "换鞋的时候",
      ],
    },
    ({ thing, occasion }) => ({
      category: "ritual",
      title: `给${thing}封一个四字头衔，在${occasion}宣布`,
      description: `头衔要具体，可以很好笑。宣布一次就生效，声音不用大。别人不必懂，你自己要念出声。`,
    }),
  ),
})

frames.push({
  category: "luck",
  items: combos(
    {
      trigger: [
        "听到的笑声",
        "看见的狗或鸟",
        "红灯",
        "绿灯",
        "滴水声",
        "门外的风",
        "开门声",
        "鸟叫",
        "碗碰碗的声音",
        "车铃",
        "一首歌的前奏",
        "电梯的叮",
        "照到你的阳光或雨",
        "孩子的笑声",
        "手机提示音",
        "自己的哈欠",
      ],
      result: [
        "给今天起一个标题",
        "去喝一杯水",
        "往安全的方向多走二十步",
        "把肩膀放下",
        "给某人发一句短问候",
        "把手机扣下五分钟",
        "哼四个音",
        "看天空十秒",
        "对最近的植物点头",
        "把一件小东西摆正",
        "写下眼前的一个词",
        "把一件小事做得很慢",
        "给晚饭起一个荒唐名字",
        "拍一张没有人脸的照片",
        "在心里说谢谢",
        "做三次慢呼吸",
        "决定下一杯喝热的还是常温",
        "把灯调到更舒服的亮度",
      ],
    },
    ({ trigger, result }) => ({
      category: "luck",
      title: `把下一个${trigger}当作命运手势，随后${result}`,
      description: `手势来了就做那件很小的事。若一直不来，就改用你的下一次哈欠。只做稳妥、免费、马上能完成的事。`,
    }),
  ),
})

frames.push({
  category: "sense",
  items: combos(
    {
      scent: [
        "肥皂",
        "茶叶",
        "书页",
        "雨后的土",
        "橘子皮",
        "面包",
        "米饭",
        "木头",
        "洗衣液",
        "牙膏",
        "枕头",
        "铅笔",
        "一把带着潮气的伞",
        "晒过太阳的布",
        "厨房",
        "花盆里的土",
        "一杯茶",
        "刚洗的衣服",
        "门口的空气",
        "洗手台",
      ],
      form: [
        "五个字",
        "一个外号",
        "一句不像广告的话",
        "四个字的封号",
        "一个比喻",
        "一句谢谢",
        "一个童话里的身份",
        "一行不押韵的小诗",
        "一个天气比喻",
        "三个字的小菜单",
        "一个温和的封号",
        "一句只说给自己的话",
      ],
    },
    ({ scent, form }) => ({
      category: "sense",
      title: `闻一闻${scent}，用${form}把这股气味记下来`,
      description: `靠近闻一下就好，不必买。写下来或说出来。若身边没有，就换成最接近的一种气味。`,
    }),
  ),
})

function build() {
  const rng = mulberry32(20261117)
  const usedTitle = new Set()
  const out = []
  const rejected = new Map()

  const push = (partial) => {
    if (out.length >= TOTAL) return false
    if (usedTitle.has(partial.title)) return false
    const slip = {
      category: partial.category,
      title: partial.title,
      description: partial.description,
      duration: partial.duration ?? durationFor(partial.category, out.length + 1),
      rank: partial.rank ?? rankFor(out.length + 1),
      verse:
        partial.verse ??
        verseFor(partial.category, partial.title, partial.rank ?? rankFor(out.length + 1)),
    }
    if (partial.verse) slip.verse = partial.verse
    if (partial.rank) slip.rank = partial.rank
    const reason = acceptable(slip)
    if (reason) {
      rejected.set(reason, (rejected.get(reason) ?? 0) + 1)
      return false
    }
    usedTitle.add(slip.title)
    out.push(slip)
    return true
  }

  for (const jewel of jewels) push(jewel)

  const buckets = frames.map((frame) => shuffle([...frame.items], rng))
  let guard = 0
  while (out.length < TOTAL && guard < 200000) {
    guard += 1
    let moved = false
    for (const bucket of buckets) {
      while (bucket.length > 0) {
        const item = bucket.shift()
        moved = true
        if (push(item)) break
      }
      if (out.length >= TOTAL) break
    }
    if (!moved) break
  }

  if (out.length < TOTAL) {
    const reasons = [...rejected.entries()].map(([key, count]) => `${key}:${count}`).join(", ")
    throw new Error(`只生成了 ${out.length} 支。跳过原因：${reasons || "无"}`)
  }

  return {
    slips: out.slice(0, TOTAL).map((slip, index) => ({
      n: index + 1,
      rank: slip.rank ?? RANKS[index % RANKS.length],
      verse: slip.verse,
      title: slip.title,
      description: slip.description,
      duration: slip.duration,
      category: slip.category,
    })),
    rejected,
  }
}

const { slips, rejected } = build()
const titles = new Set(slips.map((slip) => slip.title))
if (titles.size !== TOTAL) throw new Error("标题有重复")
for (let n = 1; n <= TOTAL; n += 1) {
  if (slips[n - 1].n !== n) throw new Error(`签号不连续：${n}`)
}

const counts = new Map()
for (const slip of slips) counts.set(slip.category, (counts.get(slip.category) ?? 0) + 1)
const needed = []
for (const category of needed) {
  if ((counts.get(category) ?? 0) < 200) {
    throw new Error(`${category} 只有 ${counts.get(category) ?? 0} 支`)
  }
}

const dir = resolve(root, "public/slips")
mkdirSync(dir, { recursive: true })
for (let start = 0; start < slips.length; start += CHUNK) {
  const chunk = slips.slice(start, start + CHUNK)
  const name = `chunk-${String(start / CHUNK).padStart(2, "0")}.json`
  writeFileSync(resolve(dir, name), JSON.stringify(chunk))
}
writeFileSync(
  resolve(dir, "manifest.json"),
  JSON.stringify({ total: slips.length, chunkSize: CHUNK }),
)

const sampleAt = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 57]
const sampleRng = mulberry32(42)
const randomAt = new Set()
while (randomAt.size < 15) randomAt.add(1 + Math.floor(sampleRng() * TOTAL))
const samples = {
  fixed: sampleAt.map((n) => slips[n - 1]),
  random: [...randomAt].map((n) => slips[n - 1]),
  counts: Object.fromEntries(counts),
  rejected: Object.fromEntries(rejected),
}
writeFileSync(resolve(root, "scripts/slip-samples.json"), JSON.stringify(samples, null, 2))
console.log(`slips ${slips.length}`)
console.log(JSON.stringify(Object.fromEntries(counts)))
if (rejected.size) console.log(`skipped ${JSON.stringify(Object.fromEntries(rejected))}`)
