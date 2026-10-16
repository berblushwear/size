const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products=[],material='all',lastFocus=null;
const chartIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M2 7h16M7 2v16M2 12h16M12 7v11"/></svg>';
const groupType=p=>Object.keys(p.sizes).includes('Inner')?'set':Object.keys(p.sizes).length>1?'multi':'one';
function summary(measures){return Object.entries(measures).filter(([key])=>key==='Lingkar Dada'||key.startsWith('Panjang')&&!key.includes('Lengan')).map(([key,value])=>`${key==='Lingkar Dada'?'LD':key==='Panjang Baju'?'PB':escapeHTML(key.replace('Panjang ','P. '))} <b>${escapeHTML(value)}</b>`).join(' · ');}
function render(){
 const q=$('#search').value.trim().toLowerCase(),size=$('#size').value;
 const visible=products.filter(p=>(material==='all'||p.material===material)&&(size==='all'||groupType(p)===size)&&(!q||p.sku.toLowerCase().includes(q)));
 $('#grid').innerHTML=visible.map(p=>`<article class="card" id="sku-${escapeHTML(p.sku)}"><div class="card-head"><div><span class="sku-label">SKU CODE</span><h2 class="sku">${escapeHTML(p.sku)}</h2></div><span class="material ${p.material==='Rayon Spandex'?'rayon':''}">${p.material}</span></div><p class="fabric-desc">${escapeHTML(p.materialDescription)}</p><div class="size-lines">${Object.entries(p.sizes).map(([name,measures])=>`<div class="size-line"><span class="size-name">${name==='Satu ukuran'?'All Size':escapeHTML(name)}</span><span class="size-value">${summary(measures)}</span></div>`).join('')}</div><div class="card-bottom"><button class="chart-button" data-chart="${escapeHTML(p.sku)}" aria-label="Lihat foto ukuran SKU ${escapeHTML(p.sku)}">${chartIcon} Foto ukuran <span class="arrow" aria-hidden="true">↗</span></button><button class="copy-button" data-copy="${escapeHTML(p.sku)}" aria-label="Salin kode SKU ${escapeHTML(p.sku)}">Salin SKU</button></div></article>`).join('');
 $('#grid').setAttribute('aria-busy','false');$('#empty').hidden=visible.length>0;$('#result-count').textContent=`${visible.length} dari ${products.length} SKU`;
}
function openChart(sku,updateHash=true){
 const p=products.find(p=>p.sku===sku);if(!p)return;
 lastFocus=document.activeElement;$('#dialog-title').textContent='SKU '+p.sku;
 const img=$('#chart-image');img.src=p.image;img.alt=`Foto panduan ukuran Berryblush SKU ${p.sku}, semua ukuran dalam cm`;
 $('#dialog-material').textContent=p.material;$('#dialog-material').className='material '+(p.material==='Rayon Spandex'?'rayon':'');$('#dialog-description').textContent=p.materialDescription;
 $('#measurements').innerHTML=Object.entries(p.sizes).map(([name,values])=>`<section class="measurement-group"><h3>${escapeHTML(name)}</h3><table aria-label="Ukuran ${escapeHTML(name)}"><tbody>${Object.entries(values).map(([key,value])=>`<tr><th scope="row">${escapeHTML(key)}</th><td>${escapeHTML(value)} cm</td></tr>`).join('')}</tbody></table></section>`).join('');
 $('#dialog-notes').innerHTML=p.notes.map(n=>`<li>${escapeHTML(n)}</li>`).join('');$('#download').href=p.image;$('#download').download=p.image.split('/').pop();
 if(!$('#chart-dialog').open)$('#chart-dialog').showModal();document.body.style.overflow='hidden';
 if(updateHash)history.replaceState(null,'','#sku='+encodeURIComponent(sku));
}
function closeChart(){ $('#chart-dialog').close(); }
$('#chart-dialog').addEventListener('close',()=>{document.body.style.overflow='';if(location.hash.startsWith('#sku='))history.replaceState(null,'',location.pathname+location.search);lastFocus?.focus();});
$('#close-dialog').addEventListener('click',closeChart);
$('#chart-dialog').addEventListener('click',e=>{if(e.target===$('#chart-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeChart();}});
$('#search').addEventListener('input',render);$('#size').addEventListener('change',render);
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{material=b.dataset.material;document.querySelectorAll('.filter').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();}));
$('#reset').addEventListener('click',()=>{$('#search').value='';$('#size').value='all';document.querySelector('[data-material="all"]').click();$('#search').focus();});
$('#grid').addEventListener('click',async e=>{const b=e.target.closest('[data-chart],[data-copy]');if(!b)return;if(b.dataset.chart)openChart(b.dataset.chart);else{try{await navigator.clipboard.writeText(b.dataset.copy);b.textContent='Tersalin ✓';setTimeout(()=>b.textContent='Salin SKU',1800);}catch{b.textContent=b.dataset.copy;}}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('#chart-dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#sku='))openChart(decodeURIComponent(location.hash.slice(5)),false);});
fetch('catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{products=data;$('#all-count').textContent=products.length;$('#knit-count').textContent=products.filter(p=>p.material==='Soft Knit').length;$('#rayon-count').textContent=products.filter(p=>p.material==='Rayon Spandex').length;render();if(location.hash.startsWith('#sku='))openChart(decodeURIComponent(location.hash.slice(5)),false);}).catch(()=>{$('#grid').setAttribute('aria-busy','false');$('#result-count').textContent='Katalog gagal dimuat. Silakan muat ulang halaman.';});
