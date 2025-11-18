import { MersenneTwister } from "./MersenneTwister.js";
import { gachaLogic } from "./gacha.js";
import { sortByRarity } from "./sort.js";
import { arraySummary } from "./arraySummary.js";
import { createTableElement } from "./createTableElement.js";
import {saveDataToLocalStorage, getDataFromLocalStorage} from "./localStrage.js";
import {createTableHeader} from "./createTableHeader.js";
class MainData
{

  //---変更されないデータ群----

  static rarityNum = 6;

  //レアリティのベース
  static rarityTable = ["N", "R", "SR", "SSR", "UR" ,"LR"];
  
  //レアリティ名、排出確率のヘッダーテキスト
  static rarityDisplayHeaderTextArray = ["表示名（編集可）", "排出確率（%）"]; 

  //アイテムのレアリティと名前編集のヘッダーテキスト
  static itemDisplayHeaderTextArray = ["レアリティ（変更可）","アイテム名（編集可）"];

  //デフォルトの確率
  static baseWeights = {
    N: 55, 
    R: 30,
    SR: 10,
    SSR: 3,
    UR: 1.5,
    LR: 0.5
  };
  //------------------------
  
  //---ユーザーの操作によって自由に変更されるデータ群-----

  //レアリティの表示変更用
  static rarityDisplayNames = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
  LR: "LR"
  };

  //アイテム名とそのレアリティ
  static resultItems = {
    N: [], 
    R: [],
    SR: [],
    SSR: [],
    UR: [],
    LR: []
  };

  //ユーザーが設定したレアリティの確率
  static editableWeights = [];

  //------------------------

  /**
   * 編集可能な値全てを取得する
   * 
   * @returns 編集可能な変数名をキーとした連想配列
   */
  static getEditableDatas() {
    const datas = {
      rarityDisplayNames: this.rarityDisplayNames,
      resultItems: this.resultItems,
      editableWeights: this.editableWeights
    }
    return datas;
  }

  /**
   * 編集可能な値全てに対して値をセットする
   * 
   * @param {Object} datas  編集可能な変数名をキーとした連想配列
   */
  static setEditableDatas(datas) {
    this.rarityDisplayNames = datas["rarityDisplayNames"];
    this.resultItems = datas["resultItems"];
    this.editableWeights = datas["editableWeights"];
  }

  //デバッグ用
  static debugMainData() {
    let msg = "MainData Debug\n\n";
    msg += "[editableWeights]\n";

    for (const [r, v] of Object.entries(MainData.editableWeights)) {
      msg += `  ${r}: ${v}\n`;
    }

    msg += "\n";
    msg += "[rarityDisplayNames]\n";

    for (const [r, v] of Object.entries(MainData.rarityDisplayNames)) {
      msg += `  ${r}: ${v}\n`;
    }

    msg += "\n";
    msg += "[resultItems]\n";

    for (const [r, items] of Object.entries(MainData.resultItems)) {
      msg += `  ${r}: ${items?.join(", ") || "(empty)"}\n`;
    }
    alert(msg);
  }
}

/**
 * ガチャシステム
 * 
 * @param {int} count ガチャ回数
 */
function callMainAction(count) {
  //入力欄から確率を取得
  const probabilities = MainData.rarityTable.slice(0, MainData.rarityNum).map(r => {
    return parseFloat(MainData.editableWeights[r] ?? MainData.baseWeights[r]);
  });
  
  // 合計チェック
  const total = calcTotalValue(probabilities);
  if (Math.abs(parseFloat(total - 100)) > 0.01) {
    alert("合計確率が100%になるように設定してください！ (現在: " + parseFloat(total.toFixed(2)) + "%)");
    return;
  }

  //ガチャの処理
  let resultLen = gachaLogic({
    gachaCount: count,
    probabilities: probabilities,
    rarityNum: MainData.rarityNum,
    rarityTable: MainData.rarityTable,
    resultItems: MainData.resultItems
  });

  //レアリティソート
  const isSort = document.getElementById("sortByRarity")?.checked;
  if(isSort) {
    resultLen = sortByRarity(resultLen, MainData.rarityTable);
  }

  //重複をまとめた表示
  const combine = document.getElementById("combineDuplicates").checked;
  if (combine) {
    resultLen = arraySummary(resultLen);
  }

  //表示処理
  const tbody = document.getElementById("resultBody");
  tbody.replaceChildren(); 
  for (const res of resultLen) {
    tbody.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${MainData.rarityDisplayNames[res.rarity]}</td><td>${res.item}</td><td>×${res.val || 1}個</td></tr>`
    );
  }
}

function updateLabels() {
   //id=tableのタグを取得し、中身を消す
  const container = document.getElementById("rarityTable");
  container.replaceChildren();

  //テーブルtagを生成
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse"; 
  table.style.marginTop = "10px";

  //ヘッダーの作成と追加
  table.appendChild(createTableHeader(MainData.rarityDisplayHeaderTextArray));
  
  //bodyの作成
  const tbody = document.createElement("tbody");

  //表示されるところ
  const adjustedWeights = MainData.rarityTable.slice(0, MainData.rarityNum).map(rarity => MainData.baseWeights[rarity]);
  
  //失われた値を最高レアリティに追加
  adjustedWeights[MainData.rarityNum - 1] += parseFloat(100 - calcTotalValue(adjustedWeights));

  //レアリティの数だけ入力欄を作成
  for (let i = 0; i < MainData.rarityNum; i++) {
    const rarity = MainData.rarityTable[i];
    const displayName = MainData.rarityDisplayNames[rarity];
    const resultValue = adjustedWeights[i].toFixed(2);
    const row = document.createElement("tr");

    //表示名入力
    const  tdNameInput = createTableElement({
      inputType: rarity + "text",
      inputValue: displayName,
      ariaLabel: "レアリティ" + rarity + "を任意の文字に置き換える為の入力欄",
      styleWidthValue: "120px",
      rarityName: rarity
    });
    tdNameInput.addEventListener("input", onNameInput);
    applyCellStyle(tdNameInput);

    //確率入力
    const  tdProbInput = createTableElement({
      inputType: "number",
      inputValue: resultValue,
      ariaLabel: "レアリティ" + rarity + "の排出確率を入力する欄",
      styleWidthValue: "80px",
      stepValue: 0.1,
      rarityName: rarity
    });
    tdProbInput.addEventListener("input", onProbInput);
    applyCellStyle(tdProbInput);
   
    //作成したエレメントを追加
    row.appendChild(tdNameInput);
    row.appendChild(tdProbInput);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

function showLineup() {
  //lineupTableの取得
  const table = document.getElementById("lineupTable");
  table.replaceChildren();

  //ラインナップの総数取得
  const totalCount = parseInt(document.getElementById("lineupNum").value) || 1;

  //ヘッダー作成
  table.appendChild(createTableHeader(MainData.itemDisplayHeaderTextArray));

  //bodyを作成
  const tbody = document.createElement("tbody");

  //アイテムを全取得
  const allItems = [];
  for (let i = 0; i < MainData.rarityNum; i++) {
    const rarity = MainData.rarityTable[i];
    //アイテム名をレアリティ毎に全取得
    const items = MainData.resultItems[rarity] || [];
    
    //レアリティ,名前のオブジェクトとしてallItemsに追加
    items.forEach(itemName => { allItems.push({ rarity, itemName }); });
  }

  // totalCount に合わせて行を作る
  for (let i = 0; i < totalCount; i++) {
    const itemData = allItems[i] || { rarity: "N", itemName: "" }; // 空白はN
    const row = document.createElement("tr");

    //レアリティプルダウン
    const rarityCell = document.createElement("td");
    const select = document.createElement("select");

    MainData.rarityTable.slice(0, MainData.rarityNum).forEach(r => {
      const option = document.createElement("option");
      option.value = r;
      option.textContent =  MainData.rarityDisplayNames[r];
      if (r === itemData.rarity) option.selected = true;
      select.appendChild(option);
    });

    //レアリティされたら登録

    rarityCell.appendChild(select);

    //アイテム名テキストボックス
    const itemCell = createTableElement({
      inputType: "text",
      inputValue: itemData.itemName,
      ariaLabel: "上から" + (i + 1) + "番目のアイテム名入力欄",
      styleWidthValue: "200px",
      rarityName: itemData.rarity
    });
    

    //名前入力欄に変更があったら登録
    itemCell.addEventListener("change", e => {

      const newName = e.target.value;

      //現在のレアリティの同名を検索
      const index = MainData.resultItems[itemData.rarity].indexOf(itemData.itemName);

      //元の配列から削除
      if (index >= 0) MainData.resultItems[itemData.rarity].splice(index, 1);

      //新しい名前を追加
      MainData.resultItems[itemData.rarity].push(newName);
      itemData.itemName = newName;
    });


    //プルダウンに変更があったら登録
    select.addEventListener("change", e => {
      //変更後のレアリティ
      const newRarity = e.target.value;

      //現在のレアリティの同名を検索
      const index = MainData.resultItems[itemData.rarity].indexOf(itemData.itemName);

      //元の配列から削除
      if (index >= 0) MainData.resultItems[itemData.rarity].splice(index, 1);
      
      //新しいレアリティに追加
      MainData.resultItems[newRarity].push(itemData.itemName);
      itemData.rarity = newRarity;
    });

    

    row.appendChild(rarityCell);
    row.appendChild(itemCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  //表スタイル
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "10px";
  table.querySelectorAll("th, td").forEach(cell => {
    cell.style.border = "1px solid black";
    cell.style.padding = "4px 8px";
  });  
}

/**
 * 編集可能な情報をロードする関数
 */
function loadMainData() {

  const datas = getDataFromLocalStorage("gacyaData");
  if(datas) {
    MainData.setEditableDatas(datas);
  }
  else {
    console.log("localdataが存在しない");
  }
}

/**
 * 編集可能な情報を保存する関数
 */
function saveMainData() {
  saveDataToLocalStorage("gacyaData",MainData.getEditableDatas());
  alert("レアリティ名を保存しました！");
}
/**
 * 文字列と一致するlocalstlageのデータを削除
 * 
 * @param {string} text localstrageの名前
 */
function deleteLocalStrageData(text) {
  if(typeof text === "string") {
    localStorage.removeItem(text);
    alert("消しました");
  }
  else {
    console.log("文字列じゃないよ");
  }
}

/**
 * メインデータの削除
 */
function deleteMainData() {
  deleteLocalStrageData("gacyaData");
}


function applyCellStyle(td) {
  Object.assign(td.style, {
    border: "1px solid black",
    padding: "4px 8px"
  });
}
/**
 * 配列内の合計値を求める関数
 * 
 * @param {number[]} numberArray
 * @returns 合計値 
 */
function calcTotalValue(numberArray){
  const totalWeight = numberArray.reduce((a, b) => a + b, 0);
  return totalWeight;
}

/**
 * ベースウェイトをレアリティの数に合わせた配列を取得する関数
 * 
 * @param {int} rarityNum 
 * @returns 
 */
function getCorrectedBaceWight(rarityNum){
  //表示されるところ
  const adjustedWeights = MainData.baseWeights.slice(0, MainData.rarityNum);
  
  //失われた値を最高レアリティに追加
  adjustedWeights[MainData.rarityNum - 1] += parseFloat(100 - calcTotalValue(adjustedWeights));
  return adjustedWeights;
}

//表示名変更
function onNameInput(e) {
  const rarity = e.target.dataset.rarity;
  const text = e.target.value.trim() || rarity;

  MainData.rarityDisplayNames[rarity] = text;
  localStorage.setItem("rarityDisplayNames", JSON.stringify(MainData.rarityDisplayNames));
  showLineup();
}

// ▼ 確率変更
function onProbInput(e) {
  const rarity = e.target.dataset.rarity;
  MainData.editableWeights[rarity] = parseFloat(e.target.value) ?? MainData.baseWeights[rarity];
}

// イベント登録
window.addEventListener("DOMContentLoaded", () => {
  loadMainData();
  updateLabels();
  showLineup(MainData.rarityNum);


  //デバッグ用
  document.getElementById("showMaindatabutton").addEventListener("click", () => MainData.debugMainData());

  // 行数変更時に再描画
  document.getElementById("lineupNum").addEventListener("change", () => {
    showLineup(MainData.rarityNum);
  });
  
  //rarityNumが変更された時
  document.getElementById("rarityNum").addEventListener("change", () => {
    //変更された値を保存
    MainData.rarityNum = parseInt(document.getElementById("rarityNum").value);
    updateLabels();
    showLineup(MainData.rarityNum);
  });

  //gachaSingleがクリックされた時
  document.getElementById("gachaSingle").addEventListener("click", () => callMainAction(1));

  //gachaTenがクリックされた時
  document.getElementById("gachaTen").addEventListener("click", () => callMainAction(10));

  //gachaCustomがクリックされた時
  document.getElementById("gachaCustom").addEventListener("click", () => {
    const count = parseInt(document.getElementById("gachaCount").value) || 1;
    callMainAction(count);
  });

  //データの保存をクリックされた時
  document.getElementById("saveButton").addEventListener("click", () =>saveMainData());

  //保存したデータの削除をクリックされた時
  document.getElementById("deleteDataButton").addEventListener("click", () =>deleteMainData());
});