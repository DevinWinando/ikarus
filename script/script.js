const searchBtn = document.querySelector(".search-btn"),
  selectKota = document.querySelector(".kota"),
  selectProv = document.querySelector(".provinsi"),
  cardRs = document.querySelector(".cardRs"),
  radio = document.querySelectorAll(".radio-btn"),
  sectionDetail = document.querySelector(".modal-dialog .modal-content "),
  loader = document.querySelector(".loading"),
  goUp = document.querySelector(".go-up"),
  modal = document.querySelector("#exampleModal");

let infoRs = ``;

// Fetch data provinsi lalu tampilkan pada select provinsi
window.addEventListener("load", async () => {
  const provinsi = await fetchProvinsi();
  tampilProvinsi(provinsi);
});

//Saat select provinsi dipilih, lakukan fetch data kota lalu tampilkan pada select kota
document.addEventListener("change", async (e) => {
  if (e.target.classList.contains("provinsi")) {
    const idProv = e.target.value;
    searchBtn.dataset.idprov = idProv;

    const kota = await fetchKota(idProv);
    tampilKota(kota);
  }
});

// Saat select provinsi dipilih, masukkan id kota yang dipilih pada button search
document.addEventListener("change", (e) => {
  if (e.target.classList.contains("kota")) {
    searchBtn.disabled = false;
    const idKota = e.target.value;
    searchBtn.dataset.idkota = idKota;
  }
});

// Saat search button diklik, lakukan fetch data rs, lalu tampilkan data tersebut
searchBtn.addEventListener("click", async function () {
  this.dataset.tipebed = cariTypeBed();

  const rs = await fetchRs(this.dataset.idprov, this.dataset.idkota, this.dataset.tipebed);
  tampilCardRs(rs);
});

// Saat detail button diclick, lakukan fetch detail RS, lalu tampilkan data tersebut
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-detail")) {
    modalLoading();
    const detail = await fetchDetailRs(e.target.dataset.idhospital, e.target.dataset.tipebed);

    tampilDetailRs(detail);
    modalGoUp();
  }
});

// Function-function
async function fetchProvinsi() {
  selectLoading(selectProv);
  try {
    const response = await fetch("https://rs-bed-covid-api.vercel.app/api/get-provinces");
    const provinsi = await response.json();

    return provinsi.provinces;
  } catch (err) {
    console.log(err);
  }
}

function tampilProvinsi(provinsi) {
  hideSelectLoading(selectProv);
  let optionProv = `<option value="" disabled selected hidden>Pilih Provinsi</option>`;

  provinsi.forEach((provinsi) => {
    optionProv += `<option value="${provinsi.id}" class="option-provinsi">${provinsi.name}</option>`;
  });
  selectProv.innerHTML = optionProv;
}

async function fetchKota(idProv) {
  selectLoading(selectKota);
  try {
    const response = await fetch("https://rs-bed-covid-api.vercel.app/api/get-cities?provinceid=" + idProv);
    const cities = await response.json();

    return cities.cities;
  } catch (err) {
    console.log(err);
  }
}

function tampilKota(kota) {
  hideSelectLoading(selectKota);
  let optionKota = `<option value="" disabled selected hidden>Pilih Kota</option>`;

  kota.forEach((kota) => {
    optionKota += `<option value="${kota.id}" class="option-kota">${kota.name}</option>`;
  });
  selectKota.innerHTML = optionKota;
}

async function fetchRs(idProv, idKota, tipeBed) {
  pageLoading();
  try {
    const response = await fetch("https://rs-bed-covid-api.vercel.app/api/get-hospitals?provinceid=" + idProv + "&cityid=" + idKota + "&type=" + tipeBed);
    const rs = await response.json();

    return rs.hospitals;
  } catch (err) {
    console.log(err);
  }
}

function tampilCardRs(rs) {
  hidePageLoading();
  infoRs = `<h3 class="fw-bold mb-4 text-center">Daftar Rumah Sakit</h3>`;
  tipeBed = cariTypeBed();

  if (rs.length === 0) {
    infoRs += `<h5 class="fw-bold text-center">Data Tidak Ditemukan</h5>`;
  }

  rs.forEach((rs) => {
    bed = rs.available_beds;

    if (tipeBed == 1) {
      rs.bed_availability > 0 ? tampilRsCovid(rs) : tampilRsCovidFull(rs);
    } else {
      tampilRsNonCovid(rs, bed);
    }
  });

  cardRs.innerHTML = infoRs;
}

async function fetchDetailRs(idHospital, tipeBed) {
  try {
    const response = await fetch("https://rs-bed-covid-api.vercel.app/api/get-bed-detail?hospitalid=" + idHospital + "&type=" + tipeBed);
    const detailRs = await response.json();
    return detailRs.data;
  } catch (e) {
    console.log(e);
  }
}

function tampilRsCovid(rs) {
  infoRs += `<div class="card available mt-3">
                        <div class="card-body">
                          <div class="row">
                            <div class="col">
                              <h5 class="card-title">${rs.name}</h5>
                              <p class="card-text">${rs.address}</p>
                              <p class="card-text text-muted">${rs.info}</p>
                            </div>
                            <div class="col-lg-3 d-lg-flex align-items-center justify-content-center">
                              <div class="availability mt-3 me-2 d-lg-flex align-items-center justify-content-center flex-wrap">
                                <h5>Tersedia : ${rs.bed_availability}</h5>
                                ${(() => {
                                  return rs.queue == 0 ? ` <p class="card-text text-muted">Tanpa Antrean</p> ` : `<p class="card-text text-muted">${rs.queue} Antrean</p>`;
                                })()}
                                
                              </div>
                            </div>
                          </div>
                          <div class="row justify-content-center mt-lg-4">
                            <div class="col d-flex align-items-center ">
                            ${(() => {
                              return rs.phone == null
                                ? ` <a href="/" onclick="return false;" class="btn btn-primary fw-bold btn-phone disabled-link"><i class="fas fa-phone me-2"></i>Tidak Tersedia</a> `
                                : `<a href="tel:${rs.phone}" class="btn btn-primary fw-bold btn-phone"><i class="fas fa-phone me-2"></i>${rs.phone}</a>`;
                            })()}
                              
                            </div>
                            <div class="col-lg-3 d-flex align-items-center justify-content-end">
                              <button type="button" class="btn btn-primary fw-bold btn-detail" data-bs-toggle="modal" data-bs-target="#exampleModal" data-idhospital="${
                                rs.id
                              }" data-tipebed="${cariTypeBed()}">Detail<i class="fas fa-arrow-right ms-2"></i></button>
                            </div>
                          </div>
                        </div>
                      </div>`;
}

function tampilRsCovidFull(rs) {
  infoRs += `<div class="card full mt-3">
                        <div class="card-body">
                          <div class="row">
                            <div class="col">
                              <h5 class="card-title">${rs.name}</h5>
                              <p class="card-text">${rs.address}</p>
                              <p class="card-text text-muted">${rs.info}</p>
                            </div>
                            <div class="col-lg-2 d-flex align-items-center justify-content-center">
                              <div class="availability d-flex align-items-center justify-content-center">
                                <h5>Penuh!</h5>
                              </div>
                            </div>
                          </div>
                          <div class="row mt-lg-4 ">
                            <div class="col">
                            ${(() => {
                              return rs.phone == null
                                ? ` <a href="/" onclick="return false;" class="btn btn-primary fw-bold btn-phone disabled-link"><i class="fas fa-phone me-2"></i>Tidak Tersedia</a> `
                                : `<a href="tel:${rs.phone}" class="btn btn-primary fw-bold btn-phone"><i class="fas fa-phone me-2"></i>${rs.phone}</a>`;
                            })()}
                            </div>
                            <div class="col-lg-3 d-flex align-items-center justify-content-end">
                              

                              <button type="button" class="btn btn-primary fw-bold btn-detail" data-bs-toggle="modal" data-bs-target="#exampleModal" data-idhospital="${
                                rs.id
                              }" data-tipebed="${cariTypeBed()}">Detail<i class="fas fa-arrow-right ms-2"></i></button>
                            </div>
                          </div>
                        </div>
                      </div>`;
}

function tampilRsNonCovid(rs, bed) {
  infoRs += `<div class="card mt-3">
          <div class="card-body">
            <div class="row">
              <div class="col">
                <h5 class="card-title">${rs.name}</h5>
                <p class="card-text">${rs.address}</p>
                <p class="card-text text-muted">${rs.info}</p>
              </div>
            </div>
            <div class="row justify-content-center align-items-start">
            ${bed
              .map((bed) => {
                if (bed.available > 0) {
                  return `<div class="col-lg-4 mt-3 d-flex align-items-center justify-content-center">
                            <div class="modal-content border-0 modal-shadow d-flex align-items-center">
                              <div class="modal-body text-center">
                                <h4>${bed.available}</h4>
                                <h5>${bed.bed_class}</h5>
                                <p>${bed.room_name}</p>
                              </div>
                              <div class="modal-footer">
                                <p class="text-muted">${bed.info}</p>
                              </div>
                            </div>
                          </div>`;
                } else {
                  return `<div class="col-lg-4 mt-3 d-flex align-items-center justify-content-center ">
                            <div class="modal-content modal-shadow d-flex align-items-center full">
                              <div class="modal-body text-center ">
                                <h4 class="color-dg">${bed.available}</h4>
                                <h5>${bed.bed_class}</h5>
                                <p>${bed.room_name}</p>
                              </div>
                              <div class="modal-footer">
                                <p class="text-muted">${bed.info}</p>
                              </div>
                            </div>
                          </div>`;
                }
              })
              .join("")}
              
            </div>
            <div class="row mt-lg-4 justify-content-center">
              <div class="col d-flex align-items-center">
              ${(() => {
                return rs.phone == null
                  ? ` <a href="/" onclick="return false;" class="btn btn-primary fw-bold btn-phone disabled-link"><i class="fas fa-phone me-2"></i>Tidak Tersedia</a> `
                  : `<a href="tel:${rs.phone}" class="btn btn-primary fw-bold btn-phone"><i class="fas fa-phone me-2"></i>${rs.phone}</a>`;
              })()}
              </div>
              <div class="col-lg-3 d-flex align-items-center justify-content-end">
                

                <button type="button" class="btn btn-primary fw-bold btn-detail" data-bs-toggle="modal" data-bs-target="#exampleModal" data-idhospital="${
                  rs.id
                }" data-tipebed="${cariTypeBed()}">Detail<i class="fas fa-arrow-right ms-2"></i></button>
              </div>
            </div>
          </div>
        </div>`;
}

function tampilDetailRs(detail) {
  const room = detail.bedDetail;

  let detailRs = `<div class="modal-body detail-rs modal-main">
                    <div class="container mt-5">
                      <div class="row justify-content-center">
                        <div class="col-lg-10 col-12">
                          <h5 class="display-5 fw-bold">Detail Rumah Sakit</h5>
                          <div class="go-up appear">
                            <button class="btn btn-primary up fw-bold fs-5" onclick="modalGoUp()"><i class="fas fa-angle-up"></i></button>
                          </div>
                          <div class="d-grid">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" style="height: 2.8rem">Kembali Ke Daftar</button>
                          </div>
                          <h4 class="mt-4">${detail.name}</h4>
                          <h5>${detail.address}</h5>
                          ${(() => {
                            return detail.phone == "hotline tidak tersedia"
                              ? ` <a href="/" onclick="return false;" class="btn btn-primary fw-bold btn-phone disabled-link"><i class="fas fa-phone me-2"></i>Tidak Tersedia</a> `
                              : `<a href="tel:${detail.phone}" class="btn btn-primary fw-bold btn-phone"><i class="fas fa-phone me-2"></i>${detail.phone}</a>`;
                          })()}

                          ${room
                            .map((room) => {
                              return `<div class="card-body room mt-3">
                                <div class="row">
                                  <div class="col-md-6 col-12">
                                    <p class="mb-0">
                                    ${room.stats.title} <br />
                                      <small>Update ${room.time}</small>
                                    </p>
                                  </div>
                                  <div class="col-md-6 col-12">
                                    <div class="row pt-2 pt-md-0">
                                      <div class="col-md-4 col-4">
                                        <div class="text-center pt-1 pb-1" style="background-color: #d0d7f7; border-radius: 5px;  color: #5670e2">
                                          <div style="font-size: 12px"><b>Tempat Tidur</b></div>
                                          <div style="font-size: 20px">${room.stats.bed_available}</div>
                                        </div>
                                      </div>
                                      <div class="col-md-4 col-4">
                                        <div class="text-center pt-1 pb-1" style="background-color: #cfe6da; border-radius: 5px; color: #209e5f">
                                          <div style="font-size: 12px"><b>Kosong</b></div>
                                          <div style="font-size: 20px">${room.stats.bed_empty}</div>
                                        </div>
                                      </div>
                                      <div class="col-md-4 col-4">
                                        <div class="text-center pt-1 pb-1" style="background-color: #e9cbbf; border-radius: 5px; color: #cd511b">
                                          <div style="font-size: 12px"><b>Antrian</b></div>
                                          <div style="font-size: 20px">${room.stats.queue}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>`;
                            })
                            .join("")}
                          
                        </div>
                      </div>
                    </div>
                  </div>`;

  sectionDetail.innerHTML = detailRs;
}

function selectLoading(selectElement) {
  selectElement.parentElement.classList.add("select-wrapper");
  selectElement.classList.replace("form-select", "loading-form-select");
  selectElement.disabled = true;
}

function hideSelectLoading(select) {
  select.parentElement.classList.remove("select-wrapper");
  select.classList.replace("loading-form-select", "form-select");
  select.disabled = false;
}

function pageLoading() {
  loader.classList.remove("d-none");
}

function hidePageLoading() {
  loader.classList.add("d-none");
  cardRs.style.opacity = "0";
  setTimeout(() => (cardRs.style.opacity = "1"), 100);
}

function modalLoading() {
  const loader = `<div class="loader" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <div class="modal-body">
                    <div class="container mt-5">
                      <div class="row justify-content-center">
                        <div class="col-lg-10 col-12">
                          <h5 class="display-5 fw-bold">Detail Rumah Sakit</h5>
                        </div>
                      </div>
                    </div>
                  </div>`;

  sectionDetail.innerHTML = loader;
}

function cariTypeBed() {
  return radio[0].checked === true ? (searchBtn.dataset.tipebed = radio[0].value) : (searchBtn.dataset.tipebed = radio[1].value);
}

function checkRadio1() {
  document.getElementById("covidRadios1").checked = "‌​checked";
}

function checkRadio2() {
  document.getElementById("covidRadios2").checked = "‌​checked";
}

function modalGoUp() {
  if (modal.classList.contains("show")) {
    const modalBody = document.querySelector(".modal-main");
    modalBody.scrollTo({
      top: "0",
      right: "0",
      behavior: "smooth",
    });
  }
}

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  if (y >= 200) {
    goUp.classList.add("appear");
  } else {
    goUp.classList.remove("appear");
  }
});
