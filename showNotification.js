
/**
 * ポップアップの表示
 * 
 * @param {string} message -表示したいメッセージ
 * @param {string} type -"success" or "error"
 * @param {Number} duration -Time 
 */
export async function showNotification(message, type = "success", duration = 3500) {
    const container = document.getElementById("notification");
    if (!container) return;

    //クラスとテキストをセット
    container.className = "notification notification--" + type;
    container.textContent = message;
    container.hidden = false;

    //自動で消す
    clearTimeout(container._hideTimeout);
    container._hideTimeout = setTimeout(function() {
        container.hidden = true;
    }, duration);
}
