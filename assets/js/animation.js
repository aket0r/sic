const navBtns = document.querySelectorAll("nav .btn button");
const navShowContent = document.querySelectorAll("nav .btn span.title");



navBtns.forEach((btn, i) => {
    btn.addEventListener("mousemove", function(event) {
        event.preventDefault();
        navShowContent[i].classList.add("active");
    });

    btn.addEventListener("mouseout", function(event) {
        event.preventDefault();
        navShowContent[i].classList.remove("active");
    });
})



const updateDataBtn = document.querySelector("#update-data");
updateDataBtn.addEventListener("click", function() {
    this.querySelector("i").className = 'fa fa-circle-o-notch';
    this.classList.add("active");
    db.update();
});

const accHstrBtn = document.querySelector("#accounts-history");
accHstrBtn.addEventListener("click", function() {
    d("#main").classList.add("hidden");
    d("#settings-page").classList.add("hidden");
    d("#accounts-history-container").classList.remove("hidden");
});

const homeBtn = document.querySelector("#home-page");
homeBtn.addEventListener("click", function() {
    d("#main").classList.remove("hidden");
    d("#settings-page").classList.add("hidden");
    d("#accounts-history-container").classList.add("hidden");
});

const settingsBtn = document.querySelector("#settings");
settingsBtn.addEventListener("click", function() {
    d("#main").classList.add("hidden");
    d("#settings-page").classList.remove("hidden");
    d("#accounts-history-container").classList.add("hidden");
})


const minSizeBtn = document.querySelector(".min-size-filter");
const collection = document.querySelector("#price-list");
minSizeBtn.addEventListener("click", function() {
    collection.classList.toggle("min");
    if(collection.classList.contains('min')) {
        this.innerHTML = '<i class="fa fa-th" aria-hidden="true"></i>'
    } else {
        this.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>'
    }
});

const usersList = document.querySelectorAll("#accounts-history-container #list #container #item");
const checkboxes = document.querySelectorAll("input[type='checkbox']");
window.addEventListener("load", function() {
    let dbupdate = this.localStorage.getItem(configuration.db.name);
    if(!dbupdate) {
        db.update();
    } else {
        let dateOfUpdTxt = this.document.querySelector("#database-updated");
        dateOfUpdTxt.innerText = this.localStorage.getItem(configuration.db.name);
    }
    checkboxes.forEach(item => {
        if(item.checked == true) {
            item.parentElement.parentElement.classList.add("active");
        } else {
            item.parentElement.parentElement.classList.remove("active");
        }
    })

    let notifTimeEl = this.document.querySelector("#notification .time");
    notifTimeEl.innerText = configuration.notification.timeout/1000;

    if(!usersList) return;
    let input = this.document.querySelector("#accs-hist-value");
    input.addEventListener("input", function() {
        for(let i = 0; i < usersList.length; i++) {
            let steamid = usersList[i].querySelector("#steamid").innerText.toLowerCase().trim();
            let username = usersList[i].querySelector("#username").innerText.toLowerCase().trim();
            let value = this.value.toLowerCase();
            console.log(`steamid: ${steamid}\nusername: ${username}\nvalue: ${value}`)
            if(username.indexOf(value) > -1 || steamid.indexOf(value) > -1) {
                usersList[i].classList.remove("hidden");
            } else {
                usersList[i].classList.add("hidden");
            }

            if(value.trim() == "") {
                usersList[i].classList.remove("hidden");
            }
        }
    });
});


checkboxes.forEach(item => {
    item.addEventListener("change", function() {
        if(this.checked == true) {
            this.parentElement.parentElement.classList.add("active");
        } else {
            this.parentElement.parentElement.classList.remove("active");
        }
    });
})