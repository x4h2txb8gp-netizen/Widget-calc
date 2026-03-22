// ============================================
// КАЛЬКУЛЯТОР ВЛАЖНОСТИ - УНИВЕРСАЛЬНЫЙ ВИДЖЕТ
// Версия на основе ваших файлов (index.html, styles.css, script.js)
// Вставьте на сайт: <script src="https://ваш-сайт.ru/widget.js"></script>
// ============================================

(function() {
  // ========== УНИКАЛЬНЫЙ ID ДЛЯ МУЛЬТИВСТАВКИ ==========
  const uid = 'widget_' + Math.random().toString(36).substr(2, 8);
  
  // ========== ОПРЕДЕЛЯЕМ БАЗОВЫЙ URL ДЛЯ ИКОНОК ==========
  const scriptTag = document.currentScript;
  const scriptSrc = scriptTag.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);
  const iconPath = baseUrl + 'icons/';
  
  // ========== КОНСТАНТЫ (из вашего script.js) ==========
  const Rv = 461.5;
  const MAGNUS_A = 6.112;
  const MAGNUS_B = 17.62;
  const MAGNUS_C = 243.12;
  const mmHg2hPa = 1.33322;
  const MIX_FACTOR = 622;
  
  let prec = 5;
  let vals = { rh: "60", abs: "0.0138", mix: "10", dew: "10", temp: "25", press: "760" };
  
  // ========== ФОРМУЛЫ (из вашего script.js) ==========
  function es(T) { return MAGNUS_A * Math.exp((MAGNUS_B * T) / (MAGNUS_C + T)); }
  function absFromRH(RH, T) { let e_hPa = (RH / 100) * es(T); return (e_hPa * 100) / (Rv * (T + 273.15)); }
  function RHFromAbs(A, T) { let e_Pa = A * Rv * (T + 273.15); return ((e_Pa / 100) / es(T)) * 100; }
  function mixFromRH(RH, T, P) { let e = (RH / 100) * es(T), P_hPa = P * mmHg2hPa; return P_hPa <= e ? Infinity : MIX_FACTOR * e / (P_hPa - e); }
  function RHFromMix(mix, T, P) { let P_hPa = P * mmHg2hPa, e = (mix * P_hPa) / (MIX_FACTOR + mix); return (e / es(T)) * 100; }
  function dewFromRH(RH, T) { if (RH <= 0) return -Infinity; let e = (RH / 100) * es(T), ln = Math.log(e / MAGNUS_A); return (MAGNUS_C * ln) / (MAGNUS_B - ln); }
  function RHFromDew(dew, T) { return (es(dew) / es(T)) * 100; }
  function absFromDew(dew, T) { return absFromRH(RHFromDew(dew, T), T); }
  function mixFromDew(dew, T, P) { return mixFromRH(RHFromDew(dew, T), T, P); }
  function dewFromAbs(A, T) { let e = A * Rv * (T + 273.15) / 100, ln = Math.log(e / MAGNUS_A); return (MAGNUS_C * ln) / (MAGNUS_B - ln); }
  function dewFromMix(mix, T, P) { return dewFromRH(RHFromMix(mix, T, P), T); }
  function maxAbs(T) { return absFromRH(100, T); }
  function maxMix(T, P) { return mixFromRH(100, T, P); }
  
  function getUnit(to) {
    const units = { 'RH': '%', 'abs': 'кг/м³', 'mix': 'г/кг', 'dew': '°C' };
    return units[to] || '';
  }
  
  function updateResultLabel(container, to) {
    const labels = { 'RH': 'Относительная влажность', 'abs': 'Абсолютная влажность', 'mix': 'Влагосодержание', 'dew': 'Точка росы' };
    const resLabel = container.querySelector('#' + uid + '_resLabel');
    const resUnit = container.querySelector('#' + uid + '_resUnit');
    if (resLabel) resLabel.innerHTML = labels[to] || 'Результат';
    if (resUnit) resUnit.innerHTML = getUnit(to);
  }
  
  function changePrec(s) {
    prec += s;
    if (prec < 0) prec = 0;
    if (prec > 10) prec = 10;
    const precSpan = document.getElementById(uid + '_prec');
    if (precSpan) precSpan.innerText = prec;
  }
  
  // ========== UI ФУНКЦИИ (из вашего script.js) ==========
  function clearErr(container) {
    container.querySelectorAll('.input-group input').forEach(i => i.classList.remove('error'));
    container.querySelectorAll('.err-msg').forEach(e => e.remove());
  }
  
  function showErr(container, id, msg) {
    let i = container.querySelector('#' + id);
    if (i) {
      i.classList.add('error');
      let p = i.closest('.input-group');
      let old = p.querySelector('.err-msg');
      if (old) old.remove();
      let d = document.createElement('div');
      d.className = 'err-msg';
      d.innerHTML = `<img src="${iconPath}x-circle.svg" width="12" height="12" alt=""> <span>${msg}</span>`;
      p.appendChild(d);
    }
  }
  
  function valNum(container, id, min, max, name) {
    let i = container.querySelector('#' + id);
    if (!i) return null;
    let v = parseFloat(i.value);
    if (isNaN(v)) { showErr(container, id, `${name} - число`); return null; }
    if (v < min || v > max) { showErr(container, id, `${name} от ${min} до ${max}`); return null; }
    return v;
  }
  
  function valT(container) { return valNum(container, uid + '_temp', -100, 100, 'Температура'); }
  function valP(container) { return valNum(container, uid + '_press', 100, 1100, 'Давление'); }
  function valRH(container) { return valNum(container, uid + '_rh', 0, 100, 'Влажность'); }
  function valAbs(container) { return valNum(container, uid + '_abs', 0, 2, 'Абс.влажность'); }
  function valMix(container) { return valNum(container, uid + '_mix', 0, 1000, 'Влагосодержание'); }
  function valDew(container) { return valNum(container, uid + '_dew', -100, 100, 'Точка росы'); }
  
  function updateDirectionHint(container) {
    let from = container.querySelector('#' + uid + '_from')?.value;
    let to = container.querySelector('#' + uid + '_to')?.value;
    let hint = container.querySelector('#' + uid + '_directionHint');
    if (hint) {
      if (from && to) {
        hint.style.display = 'none';
      } else {
        hint.style.display = 'flex';
      }
    }
  }
  
  function validateDir(container) {
    let from = container.querySelector('#' + uid + '_from')?.value;
    let to = container.querySelector('#' + uid + '_to')?.value;
    let btn = container.querySelector('#' + uid + '_calcBtn');
    let warn = container.querySelector('#' + uid + '_dirWarn');
    
    updateDirectionHint(container);
    
    if (!from || !to) {
      if (btn) { btn.disabled = true; btn.innerHTML = `<img src="${iconPath}arrow-right.svg" width="16" height="16" alt=""> <span>Выберите направление</span>`; }
      if (warn) { warn.style.display = 'flex'; warn.innerHTML = `<img src="${iconPath}alert-triangle.svg" width="12" height="12" alt=""> <span>Выберите оба параметра</span>`; }
      return false;
    }
    if (from === to) {
      if (btn) { btn.disabled = true; btn.innerHTML = `<img src="${iconPath}slash.svg" width="16" height="16" alt=""> <span>Нельзя в себя</span>`; }
      if (warn) { warn.style.display = 'flex'; warn.innerHTML = `<img src="${iconPath}alert-triangle.svg" width="12" height="12" alt=""> <span>Нельзя пересчитывать саму величину</span>`; }
      return false;
    }
    if (btn) { btn.disabled = false; btn.innerHTML = `<img src="${iconPath}flag.svg" width="16" height="16" alt=""> <span>Рассчитать</span>`; }
    if (warn) warn.style.display = 'none';
    return true;
  }
  
  function realCheck(container) {
    let from = container.querySelector('#' + uid + '_from')?.value;
    let to = container.querySelector('#' + uid + '_to')?.value;
    if (!from || !to) return;
    let t = parseFloat(container.querySelector('#' + uid + '_temp')?.value);
    let p = parseFloat(container.querySelector('#' + uid + '_press')?.value);
    if (isNaN(t) || isNaN(p)) return;
    if (from === 'dew') {
      let d = parseFloat(container.querySelector('#' + uid + '_dew')?.value);
      if (!isNaN(d) && d > t) showErr(container, uid + '_dew', `Точка росы выше температуры → Относительная влажность>100%`);
    }
    if (from === 'abs') {
      let a = parseFloat(container.querySelector('#' + uid + '_abs')?.value);
      if (!isNaN(a)) { let mx = maxAbs(t); if (a > mx) showErr(container, uid + '_abs', `Превышен максимум (${mx.toFixed(4)} кг/м³)`); }
    }
    if (from === 'mix') {
      let m = parseFloat(container.querySelector('#' + uid + '_mix')?.value);
      if (!isNaN(m)) { let mx = maxMix(t, p); if (m > mx && isFinite(mx)) showErr(container, uid + '_mix', `Выше ${mx.toFixed(1)} г/кг → Относительная влажность>100%`); }
    }
    if (t < -40) showErr(container, uid + '_temp', `Ниже -40°C возможна погрешность`);
    if (from === 'RH' && to === 'dew') {
      let rh = parseFloat(container.querySelector('#' + uid + '_rh')?.value);
      if (rh === 0) showErr(container, uid + '_rh', `При 0% точка росы не определена`);
    }
  }
  
  function update(container) {
    let from = container.querySelector('#' + uid + '_from')?.value;
    let to = container.querySelector('#' + uid + '_to')?.value;
    let inputsDiv = container.querySelector('#' + uid + '_inputs');
    if (!inputsDiv) return;
    
    let inputs = inputsDiv.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.id === uid + '_temp') vals.temp = i.value;
      else if (i.id === uid + '_press') vals.press = i.value;
      else if (i.id === uid + '_rh') vals.rh = i.value;
      else if (i.id === uid + '_abs') vals.abs = i.value;
      else if (i.id === uid + '_mix') vals.mix = i.value;
      else if (i.id === uid + '_dew') vals.dew = i.value;
    });
    
    if (!from) { inputsDiv.innerHTML = ''; updateResultLabel(container, to); validateDir(container); return; }
    
    let html = `<br><div class="input-group"><label><img src="${iconPath}thermometer.svg" width="16" height="16" alt=""> Температура, °C</label><input type="number" id="${uid}_temp" value="${vals.temp}" step="0.1"></div>
                <div class="input-group"><label><img src="${iconPath}bar-chart-2.svg" width="16" height="16" alt=""> Давление, мм рт.ст.</label><input type="number" id="${uid}_press" value="${vals.press}" step="0.1"></div>`;
    if (from === 'RH') html += `<div class="input-group"><label><img src="${iconPath}droplet.svg" width="16" height="16" alt=""> Отн.влажность, %</label><input type="number" id="${uid}_rh" value="${vals.rh}" step="0.1"></div>`;
    else if (from === 'abs') html += `<div class="input-group"><label><img src="${iconPath}droplet.svg" width="16" height="16" alt=""> Абс.влажность, кг/м³</label><input type="number" id="${uid}_abs" value="${vals.abs}" step="0.0001"></div>`;
    else if (from === 'mix') html += `<div class="input-group"><label><img src="${iconPath}cloud.svg" width="16" height="16" alt=""> Влагосодержание, г/кг</label><input type="number" id="${uid}_mix" value="${vals.mix}" step="0.01"></div>`;
    else if (from === 'dew') html += `<div class="input-group"><label><img src="${iconPath}cloud-rain.svg" width="16" height="16" alt=""> Точка росы, °C</label><input type="number" id="${uid}_dew" value="${vals.dew}" step="0.1"></div>`;
    inputsDiv.innerHTML = html;
    
    inputsDiv.querySelectorAll('input').forEach(i => { i.addEventListener('input', () => { clearErr(container); realCheck(container); }); });
    realCheck(container);
    updateResultLabel(container, to);
    validateDir(container);
  }
  
  function calc(container) {
    clearErr(container);
    if (!validateDir(container)) return;
    let from = container.querySelector('#' + uid + '_from')?.value;
    let to = container.querySelector('#' + uid + '_to')?.value;
    let span = container.querySelector('#' + uid + '_resVal');
    try {
      let T = valT(container); if (T === null) return;
      let P = valP(container); if (P === null) return;
      let res;
      if (from === 'RH') {
        let rh = valRH(container); if (rh === null) return;
        if (to === 'abs') res = absFromRH(rh, T);
        else if (to === 'mix') { res = mixFromRH(rh, T, P); if (res === Infinity) throw new Error('Давление слишком низкое'); }
        else if (to === 'dew') { if (rh === 0) throw new Error('При Относительной влажности=0% точка росы не определена'); res = dewFromRH(rh, T); }
      }
      else if (from === 'abs') {
        let A = valAbs(container); if (A === null) return;
        let mx = maxAbs(T); if (A > mx) throw new Error(`Превышен максимум (${mx.toFixed(4)} кг/м³)`);
        if (to === 'RH') res = RHFromAbs(A, T);
        else if (to === 'mix') res = mixFromRH(RHFromAbs(A, T), T, P);
        else if (to === 'dew') res = dewFromAbs(A, T);
      }
      else if (from === 'mix') {
        let mix = valMix(container); if (mix === null) return;
        let mx = mixFromRH(100, T, P); if (mix > mx && isFinite(mx)) throw new Error(`Превышен максимум (${mx.toFixed(1)} г/кг)`);
        if (to === 'RH') res = RHFromMix(mix, T, P);
        else if (to === 'abs') res = absFromRH(RHFromMix(mix, T, P), T);
        else if (to === 'dew') res = dewFromMix(mix, T, P);
      }
      else if (from === 'dew') {
        let dew = valDew(container); if (dew === null) return;
        if (dew > T) throw new Error(`Точка росы (${dew}°C) выше температуры → Относительная влажность>100%`);
        if (to === 'RH') res = RHFromDew(dew, T);
        else if (to === 'abs') res = absFromDew(dew, T);
        else if (to === 'mix') res = mixFromDew(dew, T, P);
      }
      if (res === undefined) throw new Error('Ошибка');
      if (to === 'RH' && (res < 0 || res > 100)) throw new Error(`Относительная влажность вне диапазона (${res.toFixed(1)}%)`);
      if (to === 'abs' && res < 0) throw new Error('Абс.влажность не может быть отрицательной');
      if (to === 'dew' && !isFinite(res)) throw new Error('Точка росы не определена');
      if (span) span.innerText = res.toFixed(prec);
      const resUnit = container.querySelector('#' + uid + '_resUnit');
      if (resUnit) resUnit.innerHTML = getUnit(to);
    } catch (e) { alert(e.message); if (span) span.innerText = '—'; const resUnit = container.querySelector('#' + uid + '_resUnit'); if (resUnit) resUnit.innerHTML = ''; }
  }
  
  // ========== СОЗДАНИЕ HTML СТРУКТУРЫ ==========
  const container = document.createElement('div');
  container.className = 'humidity-widget';
  
  // Вставляем контейнер перед скриптом
  scriptTag.parentNode.insertBefore(container, scriptTag);
  
  // HTML структура (все иконки используют iconPath)
  container.innerHTML = `
    <div class="card">
      <div class="head"><h2>Калькулятор влажности</h2></div>
      <div id="${uid}_directionHint" class="info"><img src="${iconPath}zap.svg" width="16" height="16" alt=""> Выберите направление расчёта</div>
      <div class="row">
        <div class="input-group">
          <label><img src="${iconPath}arrow-right.svg" width="16" height="16" alt="">Из чего:</label>
          <select id="${uid}_from">
            <option value="" disabled selected hidden>Выберите направление</option>
            <option value="RH">Относительная влажность</option>
            <option value="abs">Абсолютная влажность</option>
            <option value="mix">Влагосодержание</option>
            <option value="dew">Точка росы</option>
          </select>
        </div>
        <div class="input-group">
          <label><img src="${iconPath}arrow-left.svg" width="16" height="16" alt="">Во что:</label>
          <select id="${uid}_to">
            <option value="" disabled selected hidden>Выберите направление</option>
            <option value="RH">Относительная влажность</option>
            <option value="abs">Абсолютная влажность</option>
            <option value="mix">Влагосодержание</option>
            <option value="dew">Точка росы</option>
          </select>
        </div>
      </div>
      <div id="${uid}_dirWarn" class="warning" style="display:none"></div>
      <div id="${uid}_inputs"></div>
      <div class="input-group">
        <br>
        <label>Точность (знаков после запятой)</label>
        <div class="stepper">
          <button id="${uid}_prec_minus"><img src="${iconPath}minus.svg" width="16" height="16" alt=""></button>
          <span id="${uid}_prec">5</span>
          <button id="${uid}_prec_plus"><img src="${iconPath}plus.svg" width="16" height="16" alt=""></button>
        </div>
      </div>
      <button class="btn" id="${uid}_calcBtn" disabled><img src="${iconPath}arrow-right.svg" width="16" height="16" alt=""> <span>Выберите направление</span></button>
      <div class="result">
        <p id="${uid}_resLabel">Результат:</p>
        <div class="result-value" id="${uid}_resVal">—</div>
        <div class="result-unit" id="${uid}_resUnit"></div>
      </div>
    </div>
  `;
  
  // ========== ПОДКЛЮЧЕНИЕ СТИЛЕЙ (из вашего styles.css) ==========
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .humidity-widget * { box-sizing: border-box; margin: 0; padding: 0; }
    .humidity-widget { max-width: 600px; width: 100%; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background: #fff; border-radius: 16px; border: 0.1px dashed #485269; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .humidity-widget .head { background: #0f5c8d; margin: -20px -20px 20px -20px; padding: 14px 20px; border-radius: 16px 16px 0 0; }
    .humidity-widget h2 { color: #fff; font-size: 1.4rem; text-align: center; font-weight: 600; }
    .humidity-widget .info { background: #e3f2fd; padding: 10px 14px; border-radius: 12px; margin-bottom: 20px; font-size: 0.85rem; color: #0a3147; display: flex; align-items: center; gap: 8px; }
    .humidity-widget .row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .humidity-widget .input-group { flex: 1; min-width: 140px; margin-bottom: 16px; }
    .humidity-widget .input-group label { font-size: 0.8rem; font-weight: 500; color: #2c3e50; display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
    .humidity-widget select, .humidity-widget input { width: 100%; padding: 10px 12px; font-size: 0.95rem; border: 1px solid #d0d8e8; border-radius: 12px; background: #fff; outline: none; }
    .humidity-widget select:focus, .humidity-widget input:focus { border-color: #0f5c8d; }
    .humidity-widget input.error { border-color: #d32f2f; background: #fff5f5; }
    .humidity-widget .stepper { display: flex; align-items: center; gap: 12px; }
    .humidity-widget .stepper button { width: 38px; height: 38px; background: #0f5c8d; border: none; border-radius: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .humidity-widget .stepper button:active { transform: scale(0.95); }
    .humidity-widget .stepper span { font-size: 1.2rem; font-weight: bold; background: #eef2f7; padding: 5px 14px; border-radius: 20px; color: #0f5c8d; }
    .humidity-widget .btn { background: #0f5c8d; color: #fff; border: none; padding: 12px; font-size: 1rem; font-weight: 600; border-radius: 40px; width: 100%; margin-top: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .humidity-widget .btn:active { transform: scale(0.98); }
    .humidity-widget .btn:disabled { background: #a0b8cc; cursor: not-allowed; opacity: 0.6; transform: none; }
    .humidity-widget .result { background: #0f5c8d; border-radius: 20px; padding: 20px; margin-top: 20px; text-align: center; }
    .humidity-widget .result p { color: #fff; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; opacity: 0.9; }
    .humidity-widget .result-value { background: rgba(255,255,255,0.2); color: #fff; font-size: 2rem; font-weight: 700; padding: 12px 24px; border-radius: 60px; display: inline-block; border: 1px solid rgba(255,255,255,0.4); word-break: break-word; }
    .humidity-widget .result-unit { font-size: 0.9rem; margin-top: 8px; color: rgba(255,255,255,0.8); }
    .humidity-widget .warning { color: #d32f2f; font-size: 0.75rem; background: #ffebee; padding: 8px 12px; border-radius: 12px; margin: 5px 0 0; display: flex; align-items: center; gap: 6px; }
    .humidity-widget .err-msg { color: #d32f2f; font-size: 0.7rem; margin-top: 4px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
    .humidity-widget select option[disabled][selected] { color: #9aa6b5; }
    .humidity-widget select:invalid { color: #9aa6b5; }
    .humidity-widget select:valid { color: #2c3e50; }
    @media (max-width: 500px) { .humidity-widget { padding: 16px; } .humidity-widget .head { margin: -16px -16px 16px -16px; } .humidity-widget h2 { font-size: 1.2rem; } .humidity-widget .result-value { font-size: 1.5rem; padding: 8px 18px; } .humidity-widget .row { flex-direction: column; gap: 8px; } }
    .humidity-widget img { vertical-align: middle; }
    .humidity-widget .input-group label, .humidity-widget .info, .humidity-widget .warning, .humidity-widget .err-msg { display: flex; align-items: center; gap: 6px; }
    .humidity-widget .btn, .humidity-widget .stepper button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .humidity-widget .input-group label img, .humidity-widget .info img, .humidity-widget .warning img, .humidity-widget .err-msg img, .humidity-widget .btn img, .humidity-widget .stepper button img { display: inline-block; }
  `;
  document.head.appendChild(styleTag);
  
  // ========== НАСТРОЙКА ОБРАБОТЧИКОВ ==========
  const fromSelect = document.getElementById(uid + '_from');
  const toSelect = document.getElementById(uid + '_to');
  const precMinus = document.getElementById(uid + '_prec_minus');
  const precPlus = document.getElementById(uid + '_prec_plus');
  const calcBtn = document.getElementById(uid + '_calcBtn');
  
  function updateHandler() { update(container); }
  function calcHandler() { calc(container); }
  
  if (fromSelect) fromSelect.onchange = updateHandler;
  if (toSelect) toSelect.onchange = updateHandler;
  if (precMinus) precMinus.onclick = () => changePrec(-1);
  if (precPlus) precPlus.onclick = () => changePrec(1);
  if (calcBtn) calcBtn.onclick = calcHandler;
  
  // ========== ИНИЦИАЛИЗАЦИЯ ==========
  update(container);
  if (calcBtn) calcBtn.disabled = true;
  updateDirectionHint(container);
})();
