# SAY-SHOW LP メンテナンス手順書

映画のシーンから生まれる、AIコラボの音楽プロジェクト「SAY-SHOW」のランディングページです。

## 📋 プロジェクト構成

このプロジェクトは2つのリポジトリで構成されています：

### say-show-src (このリポジトリ / **Private**)
- ソースコード
- Jekyll 設定ファイル
- `_tracks/` マークダウンファイル
- `images/` 画像ファイル
- GitHub Actions ワークフロー

### say-show (別リポジトリ / **Public**)
- ビルド済み HTML/CSS/JS
- GitHub Pages で公開
- URL: https://say-show.github.io/say-show/

## ⚠️ 重要ルール

**すべての更新は `say-show-src` でのみ行ってください。**

`say-show` リポジトリは GitHub Actions により自動更新されます。直接編集しないでください。

## 🎵 よくある操作

### 新しい曲を追加したいときには？

1. **GitHub Issues から「新規トラック追加」を作成**
   - https://github.com/say-show/say-show-src/issues/new/choose
   - テンプレートを選択して入力

2. **Issue の各項目の説明**

| 項目 | 内容 | 例 |
|------|------|-----|
| **曲のタイトル** | 曲の名前 | 触れずに、溶けていく光 |
| **slug** | ファイル名やURL用の英語ID（ハイフン区切り） | light-that-melts-without-being-touched |
| **リリース日** | 公開日（yyyy.mm.dd形式） | 2026.02.20 |
| **インスパイアされた映画** | 着想元の映画タイトル | シザーハンズ |
| **ステータス** | `released`（配信中）か `coming-soon`（準備中） | released |
| **曲の説明・コメント** | 曲についての背景やストーリー | 映画『シザーハンズ』の冷たい刃のような... |
| **歌詞** | 曲の歌詞テキスト | 1行目\n2行目\n... |
| **Spotifyリンク** | Spotify配信URL | https://open.spotify.com/track/... |
| **Apple Musicリンク** | Apple Music配信URL | https://apple.co/... |
| **Amazon Musicリンク** | Amazon Music配信URL | https://music.amazon.co.uk/... |
| **YouTube Musicリンク** | YouTube Music配信URL | https://music.youtube.com/... |
| **カバーアート** | `{slug}.png` を準備済み確認 | チェック |

3. **Issue 作成後の自動処理**
   - GitHub Actions が自動的に `_tracks/{slug}.md` ファイルを生成
   - `images/{slug}.png` は手動で `images/` に追加する必要があります

4. **確認**
   - GitHub Actions 実行完了
   - https://say-show.github.io/say-show/ で新曲が表示されているか確認

---

### Spotify などの配信サービスに曲が追加されたときには？

1. **該当する曲のファイルを編集**
   ```
   _tracks/{slug}.md
   ```

2. **マークダウンファイルの該当フィールドを更新**
   ```markdown
   ---
   title: "曲のタイトル"
   slug: light-that-melts-without-being-touched
   status: released
   spotify: https://open.spotify.com/track/xxxxx
   apple: https://apple.co/xxxxx
   amazon: https://music.amazon.co.uk/xxxxx
   youtube: https://music.youtube.com/xxxxx
   ---
   ```

3. **git で更新**
   ```bash
   git add _tracks/{slug}.md
   git commit -m "update: {曲名} に Spotify リンクを追加"
   git push origin main
   ```

4. **自動反映**
   - GitHub Actions が自動実行
   - 数秒～数分で https://say-show.github.io/say-show/ に反映

---

### 曲のタイトル、説明、コメント、歌詞を修正したいときには？

1. **該当する曲のマークダウンファイルを直接編集**
   ```
   _tracks/{slug}.md
   ```

2. **修正内容例**
   - `title`: 曲のタイトル
   - `comment`: 曲の説明
   - ファイル内容：歌詞

3. **git で更新**
   ```bash
   git add _tracks/{slug}.md
   git commit -m "update: {曲名} の説明を修正"
   git push origin main
   ```

4. **自動反映**
   - GitHub Actions が自動実行
   - 数秒～数分で https://say-show.github.io/say-show/ に反映

---

### 画像を追加・変更したいときには？

1. **画像ファイルを `images/` に追加**
   ```
   images/{slug}.png
   ```
   - ファイル形式：PNG、JPG など
   - ファイル名：曲の slug と同じ名前

2. **マークダウンファイルで参照**
   ```markdown
   ---
   image: {slug}.png
   ---
   ```

3. **git で追加**
   ```bash
   git add images/{slug}.png _tracks/{slug}.md
   git commit -m "add: {曲名} のカバーアートを追加"
   git push origin main
   ```

4. **自動反映**
   - GitHub Actions が自動実行
   - 数秒～数分で https://say-show.github.io/say-show/ に反映

---

### デザイン・スタイルを変更したいときには？

1. **`style.css` を編集**
   ```
   style.css
   ```

2. **git で更新**
   ```bash
   git add style.css
   git commit -m "style: ヒーロー背景色を変更"
   git push origin main
   ```

3. **自動反映**
   - GitHub Actions が自動実行
   - 数秒～数分で https://say-show.github.io/say-show/ に反映

---

### 変更が LP に反映されたか確認したいときには？

1. **GitHub Actions の実行確認**
   - https://github.com/say-show/say-show-src/actions
   - 最新の「Deploy to say-show」が成功（緑）しているか確認

2. **デプロイ先の確認**
   - https://github.com/say-show/say-show
   - 最新コミットが「Auto-deploy: ...」で 2～3分以内か確認

3. **LP の確認**
   - https://say-show.github.io/say-show/
   - ブラウザをキャッシュクリア（Ctrl+Shift+R または Cmd+Shift+R）してアクセス

---

## 🚀 自動デプロイについて

### ワークフロー

```
say-show-src に push
    ↓
GitHub Actions 実行（deploy.yml）
    ↓
Jekyll でビルド（_site/ 生成）
    ↓
say-show リポジトリに自動 push
    ↓
GitHub Pages で自動公開
    ↓
https://say-show.github.io/say-show/ 更新
```

### 実行時間

通常 30 秒～2 分で完了します。

---

## 🔧 ファイル構成

```
say-show-src/
├── _tracks/              # 曲のマークダウンファイル
│   ├── song1.md
│   └── song2.md
├── images/               # 曲のカバーアート画像
│   ├── song1.png
│   └── song2.png
├── _layouts/             # Jekyll レイアウトテンプレート
├── style.css             # スタイルシート
├── main.js               # JavaScript
├── index.html            # トップページ
├── .github/workflows/    # GitHub Actions ワークフロー
│   └── deploy.yml        # 自動デプロイ定義
└── README.md             # このファイル
```

---

## ⚡ トラブルシューティング

### LP が更新されない

1. **GitHub Actions が実行されているか確認**
   - https://github.com/say-show/say-show-src/actions
   - 最新実行が失敗していないか確認

2. **ブラウザキャッシュをクリア**
   - Ctrl+Shift+R （Windows）
   - Cmd+Shift+R （Mac）

3. **2～3分待つ**
   - GitHub Actions の実行完了を待つ

### マークダウンファイルが反映されない

1. **ファイル名が正しいか確認**
   - `_tracks/{slug}.md` の形式か

2. **Front Matter が正しいか確認**
   ```markdown
   ---
   title: "タイトル"
   slug: slug-name
   status: released
   ---
   ```

3. **git push が成功しているか確認**
   ```bash
   git log --oneline -5
   ```

---

## 📚 参考資料

- Jekyll ドキュメント: https://jekyllrb.com/
- GitHub Pages: https://pages.github.com/
- GitHub Actions: https://docs.github.com/actions

---

**作成日**: 2026-01-21
**最終更新**: 2026-01-21
