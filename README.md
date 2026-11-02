# Pixel Christmas Tree

새 GitHub Repository에 바로 업로드해서 사용하는 프로젝트입니다.
기존 Google Sheets와 기존 Apps Script 웹 앱을 그대로 재사용하도록 `config.js`에 현재 웹 앱 URL을 넣어 두었습니다.

## 포함 파일

- `index.html` — 웹사이트 구조
- `style.css` — 픽셀 아트 디자인과 반응형 스타일
- `config.js` — 기존 Apps Script 웹 앱 연결 주소
- `app.js` — 트리 렌더링, 메시지 제출/표시, 성장 단계
- `Code.gs` — Google Apps Script 서버 코드
- `README.md` — 설치 안내

## 기능

- 닉네임 최대 16자
- 메시지 최대 30자
- 서버에서도 글자 수 검증
- 관리자 승인(`status`를 `approved`로 변경) 후 공개
- 승인된 메시지는 트리 아래 게시판에 항상 전체 표시
- 승인된 메시지 수에 따라 트리 가지 층이 증가
- 20초마다 승인 메시지 자동 갱신

## 새 GitHub Repository 만들기

1. GitHub에서 새 Repository를 생성합니다.
2. Public으로 설정합니다.
3. 이 ZIP의 파일 6개를 압축 해제한 뒤 Repository 최상위(root)에 업로드합니다.
4. Repository의 Settings → Pages로 이동합니다.
5. Source를 `Deploy from a branch`, Branch를 `main`, Folder를 `/ (root)`로 선택하고 Save를 누릅니다.
6. 잠시 기다린 뒤 `https://깃허브아이디.github.io/저장소이름/` 주소로 접속합니다.

## 기존 Google Sheets / Apps Script 재사용

이 프로젝트의 `config.js`는 기존 Apps Script 웹 앱 URL을 사용하도록 설정되어 있습니다. 스프레드시트를 새로 만들 필요가 없습니다.

단, 서버에서도 30자 제한이 적용되도록 기존 Apps Script 프로젝트의 코드를 업데이트해야 합니다.

1. 기존 Google 스프레드시트에서 확장 프로그램 → Apps Script를 엽니다.
2. 기존 `Code.gs`를 이 ZIP의 `Code.gs` 전체 내용으로 교체하고 저장합니다.
3. `setup()`은 다시 실행하지 마세요. 기존 `Messages` 데이터와 시트를 그대로 유지합니다.
4. 배포 → 배포 관리 → 기존 웹 앱 배포의 수정(연필) → 버전에서 새 버전 선택 → 배포를 누릅니다.
5. 기존 배포를 수정하므로 웹 앱 URL은 그대로 사용합니다.

## 메시지 승인

기존 Google Sheets의 `Messages` 시트에서 새 메시지는 `pending` 상태로 들어옵니다.
관리자가 E열 `status` 값을 `approved`로 바꾸면 사이트에 공개됩니다.
`rejected`로 바꾸면 공개되지 않습니다.

## 주의

- `config.js`에 들어 있는 Apps Script URL은 사이트 연결용 공개 주소입니다. 관리자 비밀번호나 민감한 정보는 코드에 넣지 마세요.
- 공개 웹사이트이므로 메시지에는 전화번호, 주소 등 개인정보를 쓰지 않도록 안내하세요.
- 승인된 메시지 목록은 최근 300개까지 표시됩니다.


## Messages displayed directly on the tree
Approved messages are rendered as readable labels directly over the tree branches. They remain visible without clicking; clicking a label opens a larger detail view. The separate message wall is not used. The tree becomes taller as approved messages accumulate. The website refreshes the list every 20 seconds.


## Displaying text directly on the tree
This version places every approved message as a readable text card directly over the green tree canopy. It does not use a separate message board. The full message (up to 30 characters) is visible without clicking; clicking a card only opens a larger view.

Important moderation behavior: submissions are saved as `pending`. They will NOT appear on the public tree until the administrator changes the `status` cell in the existing `Messages` sheet to `approved`. Once approved, the page shows them on the tree on the next refresh (up to 20 seconds). The existing spreadsheet and Apps Script deployment URL are reused; do not run `setup()` again.
