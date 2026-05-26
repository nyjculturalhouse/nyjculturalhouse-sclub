const API = "https://script.google.com/macros/s/AKfycbz7wNZ6WAygSpqk2fPxJxe9CyOOQlR6KHaUjC29k-hcDl2iFHMbfzDvlbtEUet36roypQ/exec";

async function apiGet(mode, params = {}) {

    const query = new URLSearchParams({
        mode,
        ...params
    }).toString();

    const res = await fetch(`${API}?${query}`);

    return await res.json();
}

async function apiPost(data) {

    await fetch(API, {
        method: "POST",
        body: JSON.stringify(data),
        mode: "no-cors"
    });
}
