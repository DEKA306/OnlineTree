const SHEET_NAME = "Messages";
const HEADERS = ["id", "createdAt", "nickname", "message", "status", "kind", "color", "x", "y"];
const COLORS = ["#ff657a", "#ffd875", "#71c8ff", "#c99aff", "#76e0b0"];

// Run setup() once from the Apps Script editor.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setColumnWidth(4, 360);
    sheet.getRange("B:B").setNumberFormat("yyyy-mm-dd hh:mm:ss");
    sheet.getRange("C:D").setNumberFormat("@");
    sheet.getRange("E:E").setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(["pending", "approved", "rejected"], true)
        .setAllowInvalid(false).build()
    );
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  let result;
  try {
    if (p.action === "submit") result = submitMessage_(p);
    else if (p.action === "list") result = listApproved_();
    else result = {ok:false, error:"Unknown action"};
  } catch (err) {
    result = {ok:false, error:"Server error"};
    console.error(err);
  }
  const callback = String(p.callback || "");
  const body = JSON.stringify(result);
  if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(callback + "(" + body + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function submitMessage_(p) {
  const rawNickname = String(p.nickname || "").trim();
  const rawMessage = String(p.message || "").trim();
  if (rawNickname.length > 16 || rawMessage.length > 30) {
    return {ok:false, error:"닉네임은 16자, 메시지는 30자까지 입력할 수 있어요."};
  }
  const nickname = cleanText_(rawNickname, 16);
  const message = cleanText_(rawMessage, 30);
  const client = String(p.client || "").slice(0, 100);
  if (!nickname || !message) return {ok:false, error:"닉네임과 메시지를 입력해 주세요."};
  if (nickname.length > 16 || message.length > 30) return {ok:false, error:"입력 글자 수를 초과했어요."};
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(client)) return {ok:false, error:"요청을 확인할 수 없어요."};

  const cache = CacheService.getScriptCache();
  const throttleKey = "submit_" + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, client)
  ).slice(0, 40);
  if (cache.get(throttleKey)) return {ok:false, error:"메시지는 30초에 한 번만 보낼 수 있어요."};

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const kind = Math.random() < 0.22 ? "star" : "ball";
    const x = 16 + Math.floor(Math.random() * 68);
    const y = 18 + Math.floor(Math.random() * 68);
    const id = Utilities.getUuid();
    sheet.appendRow([id, new Date(), safeCell_(nickname), safeCell_(message), "pending", kind, color, x, y]);
    cache.put(throttleKey, "1", 30);
    return {ok:true};
  } finally {
    lock.releaseLock();
  }
}

function listApproved_() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true, messages:[]};
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const messages = rows
    .filter(r => String(r[4]) === "approved")
    .slice(-300)
    .map(r => ({
      id: String(r[0]), nickname: String(r[2]), message: String(r[3]),
      kind: String(r[5]), color: String(r[6]),
      x: Number(r[7]), y: Number(r[8])
    }));
  return {ok:true, messages};
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Run setup() first");
  return sheet;
}

function cleanText_(value, max) {
  return String(value || "").replace(/[<>]/g, "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function safeCell_(value) {
  // Prevent user text from being interpreted as a spreadsheet formula.
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}