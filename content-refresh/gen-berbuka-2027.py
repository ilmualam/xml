"""Generates the 2027 refresh of the 14 'Jadual Waktu Berbuka Puasa & Imsak <negeri>' posts on www.ilmualam.com.
Data comes from a checkout of github.com/ilmualam/quran (official JAKIM zone timetables + its calibrated fallback):
    python3 content-refresh/gen-berbuka-2027.py ../quran
Writes content-refresh/berbuka-2027/<slug>.html and content-refresh/berbuka-2027.json (manifest for blogger-content-refresh)."""
import sys, os, json, html, datetime as dt

QURAN = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "../quran")
sys.path.insert(0, f"{QURAN}/tools")
import ramadan as R, solat as SL, plans as P
from pages3 import areas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = f"{HERE}/berbuka-2027"
TOOL = "https://quran.ilmualam.com/waktu-berbuka-puasa/"
e = lambda s: html.escape(str(s), quote=True)
# blog slug -> (state slug in quran tools, display name, current Blogger title, post URL)
POSTS = [
    ("waktu-berbuka-puasa-selangor", "selangor", "Selangor", "Jadual Waktu Berbuka Puasa & Imsak Selangor 2026 (JAKIM)"),
    ("waktu-berbuka-puasa-kl-putrajaya", "kuala-lumpur", "KL & Putrajaya", "Jadual Waktu Berbuka Puasa & Imsak KL Putrajaya  2026"),
    ("waktu-berbuka-puasa-johor", "johor", "Johor", "Jadual Waktu Berbuka Puasa & Imsak Negeri Johor 2026"),
    ("waktu-berbuka-puasa-perak", "perak", "Perak", "Jadual Waktu Berbuka Puasa & Imsak Perak 2026 (7 Zon)"),
    ("waktu-berbuka-puasa-kedah", "kedah", "Kedah", "Jadual Waktu Berbuka Puasa & Imsak Kedah 2026 (7 Zon)"),
    ("waktu-berbuka-puasa-kelantan", "kelantan", "Kelantan", "Jadual Imsak & Waktu Berbuka Puasa Kelantan 2026M-1447H"),
    ("waktu-berbuka-puasa-terengganu", "terengganu", "Terengganu", "Jadual Waktu Berbuka Puasa & Imsak Terengganu (2026M-1447H)"),
    ("waktu-berbuka-puasa-pahang", "pahang", "Pahang", "Jadual Waktu Berbuka Puasa & Imsak Negeri Pahang 2026"),
    ("waktu-berbuka-puasa-negeri-sembilan", "negeri-sembilan", "Negeri Sembilan", "Jadual Waktu Berbuka Puasa & Imsak Negeri Sembilan 2026 (3 Zon)"),
    ("waktu-berbuka-puasa-melaka", "melaka", "Melaka", "Jadual Waktu Berbuka Puasa & Imsak Negeri Melaka 2026"),
    ("waktu-berbuka-puasa-penang", "pulau-pinang", "Pulau Pinang", "Jadual Waktu Berbuka Puasa & Imsak Penang 2026"),
    ("waktu-berbuka-puasa-perlis", "perlis", "Perlis", "Jadual Waktu Berbuka Puasa & Imsak Negeri Perlis 2026"),
    ("waktu-berbuka-puasa-sabah", "sabah", "Sabah", "Jadual Waktu Berbuka Puasa & Imsak Sabah 2026 - 7 Zon"),
    ("waktu-berbuka-puasa-sarawak", "sarawak", "Sarawak", "Jadual Waktu Berbuka Puasa & Imsak Sarawak 2026 - 6 Zon"),
]
url = lambda slug: f"https://www.ilmualam.com/2022/03/{slug}.html"
STYLE = open(f"{HERE}/berbuka-2027.css", encoding="utf8").read().strip()


def hm(x):
    return SL.hm(x)


def build(slug, st, name, s, AREA):
    capz = next(c[3] for c in SL.STATES if c[0] == st)
    cap = next(c[2] for c in SL.STATES if c[0] == st)
    zones = [z for z in SL.ZONES if z[1] == st]
    tt = {z[0]: R.timetable(z[0], s) for z in zones}
    off = all(tt[z[0]][1] for z in zones)
    y, n, start = s["y"], s["n"], s["start"]
    yr, eid = start.year, start + dt.timedelta(n)
    cr = tt[capz][0]
    mg = [r[2][5] for r in cr]
    im = [r[2][0] for r in cr]
    dur = [r[2][5] - r[2][1] for r in cr]
    nz = len(zones)
    src = ("Semua waktu dalam artikel ini diambil daripada <strong>takwim waktu solat rasmi JAKIM 2027</strong> bagi setiap zon."
           if off else
           "Takwim rasmi JAKIM 2027 bagi zon di negeri ini belum diterbitkan dalam data e-solat. Waktu di bawah ialah <strong>kiraan anggaran</strong> menggunakan parameter JAKIM (Subuh 18°, Isyak 18°, Asar mazhab Syafi'i), lazimnya dalam lingkungan 1–2 minit daripada jadual rasmi. "
           f"<a href=\"{TOOL}{st}/\">Jadual interaktif kami</a> bertukar kepada waktu rasmi secara automatik sebaik sahaja data tersedia, dan artikel ini akan dikemas kini.")
    lq = [(k, start + dt.timedelta(k - 2)) for k in (21, 23, 25, 27, 29)]
    zrows = "".join(f"<tr><td><strong>{z[0]}</strong><br><small>{e(AREA[z[0]])}</small></td><td>{hm(tt[z[0]][0][0][2][0])}</td><td><strong>{hm(tt[z[0]][0][0][2][5])}</strong></td><td>{hm(tt[z[0]][0][-1][2][0])}</td><td><strong>{hm(tt[z[0]][0][-1][2][5])}</strong></td></tr>" for z in zones)

    def month(z):
        # night 21, 23 ... 29 begins at Maghrib of the day before, so the star sits on day 20, 22 ... 28
        lqn = lambda k: 20 <= k <= 28 and k % 2 == 0
        rows = "".join(f"<tr{' class=\"ilmx-lq\"' if lqn(k) else ''}><td>{k}{f' ★ malam {k + 1}' if lqn(k) else ''}</td><td>{P.dshort(d)}</td><td>{hm(t[0])}</td><td>{hm(t[1])}</td><td><strong>{hm(t[5])}</strong></td><td>{hm(t[6])}</td></tr>" for k, d, t in tt[z[0]][0])
        return (f"<details class=\"ilmx-zone\"{' open' if z[0] == capz else ''}><summary>Zon {z[0]}: {e(AREA[z[0]])}</summary>"
                f"<div class=\"ilmx-table-wrap\"><table><thead><tr><th>Ramadan</th><th>Tarikh</th><th>Imsak</th><th>Subuh</th><th>Berbuka</th><th>Isyak</th></tr></thead><tbody>{rows}</tbody></table></div></details>")
    first = sorted((tt[z[0]][0][0][2][5], z[0]) for z in zones)
    faq = [
        (f"Pukul berapa waktu berbuka puasa di {cap} pada Ramadan {yr}?",
         f"Waktu berbuka (Maghrib) bagi zon {capz} ({cap}) antara {hm(min(mg))} dan {hm(max(mg))} sepanjang Ramadan {y}H. Pada 1 Ramadan ({P.dlong(start)}), waktu berbuka ialah {hm(mg[0])} dan imsak {hm(im[0])}."),
        (f"Bilakah puasa {yr} bermula di {name}?",
         f"1 Ramadan {y}H jatuh pada {P.dlong(start)} mengikut takwim JAKIM, dan Hari Raya Aidilfitri pada {P.dlong(eid)}. Tarikh muktamad diumumkan oleh Penyimpan Mohor Besar Raja-Raja selepas rukyah hilal."),
        (f"Bilakah waktu imsak di {name}?",
         f"Imsak ialah 10 minit sebelum Subuh. Bagi zon {capz}, imsak antara {hm(min(im))} dan {hm(max(im))} sepanjang Ramadan {y}H. Sahur mesti dihentikan sebelum masuk waktu Subuh."),
        (f"Berapa lama tempoh berpuasa di {name}?",
         f"Kira-kira {min(dur) // 60} jam {min(dur) % 60} minit hingga {max(dur) // 60} jam {max(dur) % 60} minit sehari bagi zon {capz}, dikira dari Subuh hingga Maghrib."),
    ]
    if nz > 1:
        faq.insert(1, (f"Berapa zon waktu berbuka puasa di {name}?",
                       f"{name} mempunyai {nz} zon JAKIM. Pada 1 Ramadan, zon {first[0][1]} berbuka paling awal ({hm(first[0][0])}) dan zon {first[-1][1]} paling lewat ({hm(first[-1][0])}), beza {first[-1][0] - first[0][0]} minit."))
    faq_html = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in faq)
    faq_ld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    others = "".join(f'<li><a href="{url(o[0])}">{e(o[2])}</a></li>' for o in POSTS if o[0] != slug)
    body = f'''<div class="ilmx-article ilmx-berbuka">
  <div class="ilmx-answer-box">
    <strong>Jawapan segera:</strong> Puasa Ramadan {y}H di {e(name)} bermula pada <strong>{P.dlong(start)}</strong>. Di {e(cap)} (zon {capz}), <strong>imsak {hm(im[0])} dan waktu berbuka {hm(mg[0])}</strong> pada hari pertama, dan waktu berbuka sepanjang Ramadan antara {hm(min(mg))} hingga {hm(max(mg))}. Hari Raya Aidilfitri jatuh pada {P.dlong(eid)}.{f" {e(name)} mempunyai {nz} zon waktu solat; semak zon anda di bawah." if nz > 1 else ""}
  </div>

  <p>Artikel ini mengandungi jadual waktu imsak dan berbuka puasa {e(name)} bagi Ramadan {y}H / {yr} untuk {"semua " + str(nz) + " zon JAKIM" if nz > 1 else "zon " + capz}, lengkap 30 hari. Ia turut menyenaraikan tarikh penting, niat puasa dan doa berbuka. Untuk kiraan detik ke waktu berbuka dan alarm di telefon, gunakan <a href="{TOOL}{st}/">jadual interaktif waktu berbuka puasa {e(name)}</a>.</p>

  <div class="ilmx-keypoints">
    <h2>Ringkasan Ramadan {yr} di {e(name)}</h2>
    <ul>
      <li><strong>1 Ramadan {y}H:</strong> {P.dlong(start)} (tarawih pertama pada malam sebelumnya).</li>
      <li><strong>Berbuka hari pertama ({capz}):</strong> {hm(mg[0])}; imsak {hm(im[0])}.</li>
      <li><strong>Berbuka hari terakhir ({capz}):</strong> {hm(mg[-1])}.</li>
      <li><strong>Tempoh puasa:</strong> kira-kira {min(dur) // 60} jam {min(dur) % 60} minit sehari.</li>
      <li><strong>Hari Raya Aidilfitri:</strong> {P.dlong(eid)}.</li>
    </ul>
  </div>

  <div class="ilmx-cta">
    <p class="ilmx-cta-title">⏰ Jangan terlepas waktu berbuka &amp; sahur</p>
    <p>Jadual interaktif {e(name)} kami memaparkan kiraan detik ke waktu berbuka dan imsak, mengesan zon terdekat anda, dan boleh memasang <strong>alarm kalendar</strong> 10 minit sebelum berbuka (dan 30 minit sebelum imsak) untuk semua 30 hari. Ada juga penanda puasa harian untuk mengira qada. Percuma, tanpa aplikasi.</p>
    <p><a class="ilmx-btn" href="{TOOL}{st}/">Buka Jadual Interaktif {e(name)} →</a></p>
  </div>

  <h2>{"Waktu Imsak &amp; Berbuka Ikut Zon " + e(name) if nz > 1 else "Zon Waktu Solat " + e(name)} ({yr})</h2>
  <div class="ilmx-table-wrap"><table>
    <thead><tr><th>Zon &amp; kawasan</th><th>Imsak 1 Ramadan</th><th>Berbuka 1 Ramadan</th><th>Imsak {n} Ramadan</th><th>Berbuka {n} Ramadan</th></tr></thead>
    <tbody>{zrows}</tbody>
  </table></div>
  <p class="ilmx-small">{src}</p>

  <h2>Jadual Imsak &amp; Berbuka Puasa {e(name)} {yr} (30 Hari)</h2>
  <p>{"Tekan nama zon untuk membuka jadualnya. " if nz > 1 else ""}★ menandakan hari yang Maghribnya memulakan malam ganjil 10 malam terakhir (malam 21, 23, 25, 27 dan 29).</p>
  {"".join(month(z) for z in zones)}

  <h2>Tarikh Penting Ramadan {y}H</h2>
  <div class="ilmx-table-wrap"><table>
    <thead><tr><th>Peristiwa</th><th>Tarikh</th></tr></thead>
    <tbody>
      <tr><td>1 Ramadan (mula puasa)</td><td>{P.dlong(start)}</td></tr>
      <tr><td>Nuzul Al-Quran (17 Ramadan)</td><td>{P.dlong(start + dt.timedelta(16))}</td></tr>
      <tr><td>10 malam terakhir bermula</td><td>Maghrib {P.dlong(lq[0][1])}</td></tr>
      <tr><td>Malam 27 Ramadan</td><td>Maghrib {P.dlong(lq[3][1])}</td></tr>
      <tr><td>Hari Raya Aidilfitri</td><td>{P.dlong(eid)}</td></tr>
    </tbody>
  </table></div>

  <h2>Apakah Waktu Imsak &amp; Waktu Berbuka?</h2>
  <p><strong>Imsak</strong> ialah 10 minit sebelum Subuh, iaitu waktu berjaga-jaga untuk berhenti makan dan minum. Puasa sebenarnya bermula apabila masuk waktu Subuh (terbit fajar sadiq). <strong>Waktu berbuka</strong> ialah waktu Maghrib, apabila matahari terbenam sepenuhnya. Rasulullah SAW menganjurkan supaya disegerakan berbuka: “Manusia sentiasa dalam kebaikan selagi mereka menyegerakan berbuka” (HR Al-Bukhari, no. 1957; Muslim, no. 1098).</p>

  <h2>Niat Puasa &amp; Doa Berbuka</h2>
  <div class="ilmx-prayer-card">
    <h3>Niat puasa Ramadan (setiap malam)</h3>
    <div class="ilmx-arabic" dir="rtl" lang="ar">نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هٰذِهِ السَّنَةِ لِلّٰهِ تَعَالَى</div>
    <p class="ilmx-rumi">Nawaitu sauma ghadin 'an ada'i fardhi syahri Ramadhana hazihis-sanati lillahi ta'ala.</p>
    <p>Maksud: Sahaja aku berpuasa esok hari bagi menunaikan fardu bulan Ramadan tahun ini kerana Allah Taala.</p>
  </div>
  <div class="ilmx-prayer-card">
    <h3>Doa berbuka puasa (hadis)</h3>
    <div class="ilmx-arabic" dir="rtl" lang="ar">ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللّٰهُ</div>
    <p class="ilmx-rumi">Zahabaz-zama'u wabtallatil-'uruqu wa thabatal-ajru insya-Allah.</p>
    <p>Maksud: Telah hilang dahaga, telah basah urat-urat, dan telah tetap pahala, insya-Allah. (HR Abu Daud, no. 2357, hasan)</p>
  </div>
  <div class="ilmx-prayer-card">
    <h3>Doa berbuka puasa (lafaz popular)</h3>
    <div class="ilmx-arabic" dir="rtl" lang="ar">اللّٰهُمَّ لَكَ صُمْتُ وَعَلٰى رِزْقِكَ أَفْطَرْتُ</div>
    <p class="ilmx-rumi">Allahumma laka sumtu wa 'ala rizqika aftartu.</p>
    <p>Maksud: Ya Allah, kerana-Mu aku berpuasa dan dengan rezeki-Mu aku berbuka. (HR Abu Daud, no. 2358; mursal. Tambahan “wa bika amantu…” tidak terdapat dalam riwayat hadis.)</p>
  </div>
  <p>Lafaz penuh niat sebulan dan doa sahur: <a href="/2025/12/niat-puasa-ramadan.html">Niat Puasa Ramadan</a> · <a href="/2025/12/doa-berbuka-niat-puasa.html">Doa Berbuka Puasa &amp; Niat</a>.</p>

  <h2>Tips Bersahur &amp; Berbuka</h2>
  <ul>
    <li><strong>Lewatkan sahur</strong> hingga hampir imsak; “bersahurlah, kerana pada sahur ada keberkatan” (HR Al-Bukhari, no. 1923).</li>
    <li>Pilih karbohidrat kompleks dan protein ketika sahur, dan minum air secukupnya.</li>
    <li><strong>Berbuka dengan kurma</strong> atau air, kemudian solat Maghrib sebelum makan berat (HR Abu Daud, no. 2356).</li>
    <li>Rancang khatam: kira-kira 20 muka surat sehari dengan <a href="https://quran.ilmualam.com/jadual-khatam-al-quran/#hari=30">Jadual Khatam 30 Hari</a>.</li>
    <li>Semak <a href="/2026/09/kadar-zakat-fitrah.html">kadar zakat fitrah 2027</a> negeri anda sebelum hujung Ramadan.</li>
  </ul>

  <h2>Soalan Lazim: Berbuka Puasa di {e(name)}</h2>
  <div class="ilmx-faq">{faq_html}</div>

  <h2>Jadual Waktu Berbuka Puasa Negeri Lain</h2>
  <ul class="ilmx-cols">{others}</ul>

  <div class="ilmx-source-box">
    <h2>Rujukan</h2>
    <ul>
      <li>Takwim waktu solat JAKIM 2027 (e-solat.gov.my, melalui mirror api.waktusolat.app), zon {", ".join(z[0] for z in zones)}.</li>
      <li>Tarikh 1 Ramadan dan 1 Syawal 1448H: lajur Hijrah takwim JAKIM; keputusan muktamad oleh Penyimpan Mohor Besar Raja-Raja.</li>
      <li>Hadis: Sahih Al-Bukhari no. 1923, 1957; Sahih Muslim no. 1098; Sunan Abu Daud no. 2356, 2357, 2358.</li>
    </ul>
  </div>
</div>

<script type="application/ld+json">{faq_ld}</script>

<style>{STYLE}</style>'''
    title = f"Jadual Waktu Berbuka Puasa & Imsak {name} 2027" + (f" ({nz} Zon)" if nz > 1 else "")
    desc = f"Waktu berbuka puasa & imsak {name} Ramadan 2027 ({y}H) bagi {'semua ' + str(nz) + ' zon' if nz > 1 else 'zon ' + capz} JAKIM: jadual 30 hari, tarikh penting, niat dan doa berbuka."
    return body, title, desc[:155], off


s = R.season(dt.date(2026, 10, 19))
assert s["official"] and s["start"] == dt.date(2027, 2, 8), s
AREA = areas()
os.makedirs(OUT, exist_ok=True)
man = {"posts": []}
for slug, st, name, cur in POSTS:
    body, title, desc, off = build(slug, st, name, s, AREA)
    open(f"{OUT}/{slug}.html", "w", encoding="utf8", newline="\n").write(body + "\n")
    man["posts"].append({"url": url(slug), "expectedCurrentTitle": cur, "newTitle": title, "searchDescription": desc,
                         "contentFile": f"berbuka-2027/{slug}.html"})
    print(f"{slug}: {len(body)} bytes, {'official' if off else 'calculated'} | {title}")
json.dump(man, open(f"{HERE}/berbuka-2027.json", "w", encoding="utf8"), ensure_ascii=False, indent=2)
