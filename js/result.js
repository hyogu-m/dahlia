// URLから診断タイプ取得

const params = new URLSearchParams(location.search);
const type = params.get("type");


// 診断データ

const results = {

 powerLion:{
  name:"パワフルライオン",
  text:"肉中心のエネルギッシュタイプ"
 },

 healthyKoala:{
  name:"ヘルシーコアラ",
  text:"野菜中心の健康タイプ"
 },

 pigBoss:{
  name:"どすこいピッグ",
  text:"揚げ物大好き豪快タイプ"
 },

 chameleon:{
  name:"ミーハーカメレオン",
  text:"色々頼むバランスタイプ"
 }

};


// 表示

const result = results[type];

document.getElementById("result-name").textContent = result.name;
document.getElementById("result-text").textContent = result.text;


// QRコード生成

new QRCode(
 document.getElementById("qr"),
 location.href
);