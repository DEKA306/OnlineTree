# Pixel Christmas Tree — Google Sheets edition

Firebase 없이 GitHub Pages + Google Apps Script + Google Sheets로 운영합니다.

## 구성
- `index.html`, `style.css`, `app.js`: 공동 픽셀 트리 웹사이트
- `config.js`: Apps Script 웹 앱 URL 설정
- `Code.gs`: 메시지 접수 및 승인 메시지 조회
- Google Sheets: 메시지 검토/승인

## 1. Google 스프레드시트 만들기
1. https://sheets.google.com 에서 새 스프레드시트를 만듭니다.
2. 이름을 `Pixel Christmas Messages`로 정합니다.
3. 확장 프로그램 > Apps Script를 엽니다.
4. 기본 `Code.gs` 내용을 모두 지우고 이 폴더의 `Code.gs` 내용을 붙여넣습니다.
5. 저장합니다.
6. 함수 선택에서 `setup`을 선택하고 실행합니다.
7. 권한 요청이 나오면 본인 계정으로 승인합니다.
8. 스프레드시트에 `Messages` 탭과 헤더가 생겼는지 확인합니다.

## 2. Apps Script 웹 앱 배포
1. Apps Script 우측 상단 배포 > 새 배포
2. 유형 선택(톱니) > 웹 앱
3. 설명: `Pixel Christmas API`
4. 다음 사용자 인증 정보로 실행: 나
5. 액세스 권한: 모든 사용자
6. 배포를 누르고 권한을 승인합니다.
7. 생성된 웹 앱 URL (`https://script.google.com/macros/s/.../exec`)을 복사합니다.

중요: 웹 앱을 "나로 실행"하고 "모든 사용자"에게 공개하면 인터넷 사용자가 스크립트를 호출할 수 있습니다. 공개 제출 기능이므로 스팸 위험이 있습니다. 소유자의 Apps Script/Sheets 할당량을 사용하므로 사용량을 모니터링하세요.

## 3. 웹사이트에 연결
1. `config.js`를 엽니다.
2. `SCRIPT_URL` 값에 복사한 웹 앱 URL을 넣습니다.
3. 파일을 저장합니다.

## 4. GitHub Pages 배포
1. GitHub 저장소 최상위에 `index.html`, `style.css`, `config.js`, `app.js`를 업로드합니다.
2. Settings > Pages > Deploy from a branch
3. `main` / `/(root)` 선택 후 Save
4. 배포된 주소를 엽니다.

## 5. 메시지 승인
1. 소유자만 접근 가능한 Google 스프레드시트를 엽니다.
2. `Messages` 탭에서 새 행을 확인합니다.
3. `status` 열(E열)의 `pending`을 `approved`로 바꿉니다.
4. 거절하려면 `rejected`로 바꿉니다.
5. 승인 메시지는 방문자 화면에 약 20초 내 반영됩니다.

## 한도와 보안
- 이 버전은 승인 메시지 중 최근 300개를 트리에 표시합니다.
- 클라이언트는 30초당 1회 제출 제한을 사용하지만, 브라우저의 client ID를 바꾸면 우회할 수 있습니다. 강력한 봇 방지 장치가 아닙니다.
- Apps Script 웹 앱을 공개하면 익명 제출을 막을 수 없으므로 스프레드시트는 절대 공개 공유하지 마세요.
- 악성 메시지는 승인 전에 공개되지 않습니다. 관리자가 내용을 확인한 뒤 승인하세요.
- Apps Script/Sheets 무료 할당량은 Google 정책에 따라 변경될 수 있습니다. 공식 한도: https://developers.google.com/apps-script/guides/services/quotas
- 트리 조회는 JSONP GET 요청을 사용합니다. URL에 사용자 메시지가 포함될 수 있으므로 민감한 개인정보를 남기지 않도록 안내하세요.
- 서비스 이용량이 커지거나 스팸이 많아지면 Firebase/Supabase 등 인증·보안 기능이 더 강한 백엔드로 이전하는 것이 좋습니다.
