function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('hidden');
}

['statPenduduk', 'statEkonomi', 'statMelek', 'statPertanian'].forEach(id => {
    const inp = document.getElementById(id);
    inp.value = localStorage.getItem(id) || inp.value;
    inp.addEventListener('change', function() { 
        localStorage.setItem(id, this.value); 
    });
});
