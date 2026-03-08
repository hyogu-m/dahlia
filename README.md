# オーダーアニマル診断

居酒屋メニューを選んで注文し、注文傾向から「動物タイプ診断」を表示するWebアプリです。  
`index.html` から開始し、`category.html` で注文、`result.html` で診断結果を表示します。

## 画面構成

1. `index.html`  
「注文を始める」ボタンからメニュー画面へ遷移。
2. `category.html`  
メニュー数量選択、注文確認、履歴表示。「おあいそ」で診断結果へ遷移。
3. `result.html`  
診断タイプ名・説明文・画像・QRコードを表示。

## 使用ファイル

- `index.html`: ランディング画面
- `category.html`: 注文/履歴/おあいそ画面
- `result.html`: 診断結果画面
- `script.js`: 画面遷移、注文UI、履歴管理
- `js/diagnosis.js`: 診断ロジック（タグ集計）
- `js/result.js`: 診断結果の文言/画像表示、QR生成
- `style.css`: 全画面のスタイル
- `assets/`: メニュー画像、効果音など
- `img/`: 診断結果の動物画像

## 起動方法

1. このディレクトリを開く
2. `index.html` をブラウザで開く

## 仕様メモ

- 診断は注文アイテムの `tags` を集計して判定します。
- 履歴は `localStorage`（キー: `dahlia_checkout_history`）に保存されます。
- `style.css` の `--host-footer-offset` で、埋め込み先サイトの固定フッター分オフセットできます。

## カスタマイズしやすい場所

- 診断文の内容: `js/result.js` の `results`
- 診断画像の対応: `js/result.js` の `images`
- 診断判定ルール: `js/diagnosis.js`
- 色・余白・文字サイズ: `style.css`
