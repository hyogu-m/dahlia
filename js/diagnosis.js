function diagnose(orders) {
  // 0. 【特殊判定】胃もたれゾウさん (例: 10個以上)
  const LIMIT_COUNT = 10; 
  if (orders.length >= LIMIT_COUNT){
     return "heavyElephant";
  }

  // 1. 各タグの集計用
  const counts = {
    "肉": 0, "重": 0, "揚げ物": 0, "酒": 0, "スピードメニュー": 0,
    "和食": 0, "海外": 0, "魚": 0, "洋": 0, "茶色": 0, "甘": 0, "野菜": 0, "軽": 0
  };

  orders.forEach(food => {
    food.tags.forEach(tag => {
      const normalizedTag = tag === "スピード" ? "スピードメニュー" : tag;
      if (counts.hasOwnProperty(normalizedTag)) {
        counts[normalizedTag]++;
      }
    });
  });

  // 2. 最大値（maxVal）を探す
  const maxVal = Math.max(...Object.values(counts));
  if (maxVal === 0) return "chameleon";

  // 3. 最大値と同じ値を持つタグをすべて抽出
  // ここで、配列の並びを「優先順位順」にしておくのがポイント
  const priorityOrder = [
    "肉", "重", "揚げ物", "酒", "スピードメニュー", 
    "和食", "海外", "魚", "洋", "茶色", "甘", "野菜", "軽"
  ];

  const topTags = priorityOrder.filter(tag => counts[tag] === maxVal);

  // 4. 同数個数による分岐
 
  // topTags.length の数によって直接 return する
  if (topTags.length >= 3 || topTags.length === 0) {
    return "chameleon"; 
   }

  // 1個、または2個の場合は、priorityOrderで先にフィルターされた方（＝優先度高）を返す
  const chosenTag = topTags[0];

  // 【変換表】日本語タグ → result.js で使う英語キー
  const tagToKey = {
   "肉": "lion",
   "重": "fullElephant",
   "揚げ物": "pig",
   "酒": "snake",
   "スピードメニュー": "cheetah",
   "和食": "japaneseStyle",
   "海外": "panda",
   "魚": "pelican",
   "洋": "alpaca",
   "茶色": "bear",
   "甘": "raccoonDog",
   "野菜": "koala",
   "軽": "rabbit"
  };

 return tagToKey[chosenTag] || "chameleon";
}

function goToResultPage(orders) {
  const type = diagnose(orders); // 計算実行
  window.location.href = `result.html?type=${type}`; // ページ遷移
}