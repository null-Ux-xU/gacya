
/**
 * テーブルの要素を作成する関数
 * 
 * @param {object} params パラメータ
 * @param {string}  params.inputType inputのtype
 * @param {object}  params.inputValue 値
 * @param {string} params.ariaLabel 補助テキスト
 * @param {string} params.elementId id
 * @param {float}  params.styleWidthValue styleWidthの値
 * @param {float}  params.stepValue stepValueの値
 * @param {string}  params.rarityName レアリティ名(編集か確率取得に使う)
 * @returns  ```<td> <input> </td>``` || null 
 */
export function createTableElement({inputType, inputValue, ariaLabel, elementId = null, styleWidthValue = null, rarityName = null, stepValue = null}) {
    const tdElement = document.createElement("td"); //td作成
    const input = document.createElement("input");  //input作成

    input.type = inputType;                     //type指定
    input.value = inputValue;                   //vaue指定
    input.ariaLabel = ariaLabel                 //補助テキスト
    
    if(elementId !== null) {
        input.id = elementId;                   //id指定
    }

    if(rarityName !== null) {
        input.dataset.rarity = rarityName;      //レアリティ名の編集用
    }

    if(styleWidthValue !== null) {
        input.style.width = styleWidthValue;    //style.width指定
    }

    if(stepValue !== null) {
        input.step = stepValue;                 //step指定
    } 
    tdElement.appendChild(input);
    return tdElement;
}