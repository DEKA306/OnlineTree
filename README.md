# Pixel Christmas Tree — Classic Layout

## 적용된 화면 구성
- 트리에는 픽셀 장식만 표시됩니다.
- 장식을 클릭하면 해당 메시지가 팝업으로 열립니다.
- 트리 아래의 '모두의 메시지' 영역에 승인된 메시지를 카드 형태로 따로 모아 보여줍니다.
- 메시지 본문은 입력창과 서버 양쪽에서 최대 30자입니다. 닉네임은 최대 16자입니다.
- 승인된 메시지는 20초마다 자동 갱신됩니다.

## GitHub Pages 배포
1. ZIP 압축을 풉니다.
2. 파일을 GitHub 저장소 최상위(root)에 업로드하고 기존 파일을 덮어씁니다.
3. Settings → Pages에서 `Deploy from a branch`, `main`, `/(root)`를 선택합니다.

## 기존 Google Sheets / Apps Script
- `config.js`는 기존 Apps Script 웹 앱 URL을 그대로 사용합니다.
- 기존 Google Sheets와 `Messages` 시트는 그대로 사용합니다.
- `Code.gs`에는 메시지 30자 제한과 관리자 승인(`pending` → `approved`) 처리가 포함되어 있습니다.
- 현재 배포된 Apps Script에도 같은 코드가 적용되어 있다면 Apps Script를 수정하거나 재배포할 필요가 없습니다.
- `setup()`을 다시 실행하지 마세요. 기존 데이터를 초기화하거나 새로 만들 필요가 없습니다.

## 메시지 공개
새 메시지는 `pending` 상태로 저장됩니다. Google Sheets의 `Messages` 시트에서 해당 행의 `status`를 `approved`로 바꾸면 공개됩니다. `rejected`는 공개되지 않습니다.

## 주의
공개 웹사이트이므로 메시지에 전화번호, 주소, 비밀번호 등 개인정보를 적지 않도록 안내하세요.
