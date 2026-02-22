(function () {
    const table = document.getElementById('contactsTable');
    const tbody = table.querySelector('tbody');
    const globalFilter = document.getElementById('globalFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    const columnFilters = Array.from(document.querySelectorAll('.column-filter'));
    const paginationContainer = document.getElementById('pagination'); 


    let sortKey = null;
    let sortDir = 1; // 1 asc, -1 desc
    let allContacts = [];
    let currentPage = 1;
    const pageSize = 4;


    // ===== Fetch all data on load =====
    async function loadContacts() {
        allContacts = await fetch('/Contact/Get').then(r => r.json());
        renderPage();
        renderPagination();
    }
    
    // ===== Helpers =====
    function compareObjects(a, b, key) {
        const k = key.charAt(0).toLowerCase() + key.slice(1);

        let av = a[k];
        let bv = b[k];

        // date
        if (key === "DateOfBirth") {
            av = av ? new Date(av) : new Date(0);
            bv = bv ? new Date(bv) : new Date(0);
            return (av - bv) * sortDir;
        }

        // number
        if (!isNaN(parseFloat(av)) && !isNaN(parseFloat(bv))) {
            return (parseFloat(av) - parseFloat(bv)) * sortDir;
        }

        // string
        return (av ?? "").toString().localeCompare((bv ?? "").toString()) * sortDir;
    }


    // ===== Rendering =====
    function renderPage() {
        tbody.innerHTML = "";
        let filtered = applyFilters(allContacts); 
        if (sortKey) {
            filtered.sort((a, b) => compareObjects(a, b, sortKey));
        }

        const start = (currentPage - 1) * pageSize;
        const pageData = filtered.slice(start, start + pageSize);

        for (const c of pageData) {
            const tr = document.createElement('tr');
            tr.dataset.id = c.id;
            tr.innerHTML = `
            <td class="cell" data-key="Id">${c.id}</td>
            <td class="cell" data-key="Name">${c.name}</td>
            <td class="cell" data-key="DateOfBirth">${c.dateOfBirth ? c.dateOfBirth.slice(0, 10) : ''}</td>
            <td class="cell" data-key="Married">${c.married}</td>
            <td class="cell" data-key="Phone">${c.phone}</td>
            <td class="cell" data-key="Salary">${c.salary?.toFixed(2) ?? ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit">Edit</button>
                <button class="btn btn-sm btn-outline-danger delete">Delete</button>
            </td>`;
            tbody.appendChild(tr);
        }

        renderPagination(filtered.length);
    }

    function renderPagination() {
        const filtered = applyFilters(allContacts);
        const totalPages = Math.ceil(filtered.length / pageSize);
        paginationContainer.innerHTML = "";

        if (totalPages <= 1) return; 

        // ===== Button "Prev" =====
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "«";
        prevBtn.className = "btn btn-sm " + (currentPage === 1 ? "btn-secondary disabled" : "btn-light");
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage();
                renderPagination();
            }
        });
        paginationContainer.appendChild(prevBtn);

        // ===== Page button creation function =====
        const addPageButton = (page) => {
            const btn = document.createElement("button");
            btn.textContent = page;
            btn.className = "btn btn-sm " + (page === currentPage ? "btn-primary" : "btn-light");
            btn.addEventListener("click", () => {
                currentPage = page;
                renderPage();
                renderPagination();
            });
            paginationContainer.appendChild(btn);
        };

        // ===== Displaying pages =====
        if (totalPages <= 7) {
            // show all
            for (let i = 1; i <= totalPages; i++) {
                addPageButton(i);
            }
        } else {
            // always show 1 and last
            addPageButton(1);

            if (currentPage > 3) {
                const dots = document.createElement("span");
                dots.textContent = "...";
                dots.className = "mx-1";
                paginationContainer.appendChild(dots);
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                addPageButton(i);
            }

            if (currentPage < totalPages - 2) {
                const dots = document.createElement("span");
                dots.textContent = "...";
                dots.className = "mx-1";
                paginationContainer.appendChild(dots);
            }

            addPageButton(totalPages);
        }

        // ===== Button "Next" =====
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "»";
        nextBtn.className = "btn btn-sm " + (currentPage === totalPages ? "btn-secondary disabled" : "btn-light");
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage();
                renderPagination();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    

    // ===== Filters =====
    function applyFilters(data) {
        const global = globalFilter.value.trim().toLowerCase();
        const perColumn = Object.fromEntries(columnFilters.map(i => [i.dataset.key, i.value.trim().toLowerCase()]));

        return data.filter(c => {
            let visible = true;

            // global filter
            if (global) {
                const text = Object.values(c).join(" ").toLowerCase();
                visible = text.includes(global);
            }

            // column filters
            if (visible) {
                for (const [key, val] of Object.entries(perColumn)) {
                    if (!val) continue;
                    const fieldVal = (c[key.toLowerCase()] ?? "").toString().toLowerCase();

                    if (key === "Salary") {
                        const raw = val.replace(/\s+/g, "");
                        const num = parseFloat(raw.replace(/^[<>]=?/, ""));
                        if (raw.includes("..")) {
                            const [a, b] = raw.split("..").map(parseFloat);
                            const v = parseFloat(c.salary) || 0;
                            if (!(v >= a && v <= b)) { visible = false; break; }
                        } else if (raw.startsWith(">=")) { if (!(c.salary >= num)) { visible = false; break; } }
                        else if (raw.startsWith(">")) { if (!(c.salary > num)) { visible = false; break; } }
                        else if (raw.startsWith("<=")) { if (!(c.salary <= num)) { visible = false; break; } }
                        else if (raw.startsWith("<")) { if (!(c.salary < num)) { visible = false; break; } }
                        else { if (!fieldVal.includes(raw)) { visible = false; break; } }
                    }
                    else if (key === "DateOfBirth") {
                        // ===== Date filter =====
                        if (!c.dateOfBirth) { visible = false; break; }
                        const cellDate = c.dateOfBirth.slice(0, 10); // yyyy-MM-dd
                        if (!cellDate.includes(val)) { visible = false; break; }
                    } 
                    else {
                        if (!fieldVal.includes(val)) { visible = false; break; }
                    }
                }
            }
            return visible;
        });
    }


    // ===== Sort =====
    function sortBy(key) {
        // toggle direction if sorting by the same key
        if (sortKey === key) {
            sortDir *= -1;
        } else {
            sortKey = key;
            sortDir = 1;
        }

        allContacts.sort((a, b) => compareObjects(a, b, key));

        currentPage = 1;
        renderPage();
        renderPagination();
    }

    // ===== Events =====
    table.querySelectorAll('thead th[data-key]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => sortBy(th.dataset.key));
    });

    globalFilter.addEventListener('input', () => { currentPage = 1; renderPage(); renderPagination(); });
    columnFilters.forEach(i => i.addEventListener('input', () => { currentPage = 1; renderPage(); renderPagination(); }));
    clearFilterBtn.addEventListener('click', () => {
        globalFilter.value = '';
        columnFilters.forEach(i => i.value = '');
        currentPage = 1;
        renderPage();
        renderPagination();
        clearFilterBtn.blur();
    });

    // ===== Inline editing =====
    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const row = btn.closest('tr');
        const id = parseInt(row.dataset.id);

        if (btn.classList.contains('edit')) {
            if (row.classList.contains('editing')) { return; }
            row.classList.add('editing');
            btn.classList.remove('edit');
            btn.classList.add('save');
            btn.textContent = 'Save';
            const delBtn = row.querySelector('.delete');
            delBtn.textContent = 'Cancel';
            delBtn.classList.add('cancel'); delBtn.classList.remove('delete');

            row.querySelectorAll('.cell').forEach(td => {
                const key = td.dataset.key;
                const val = td.textContent.trim();
                let inputHtml = '';
                if (key === 'Id') {
                    inputHtml = `<span>${val}</span>`;
                } else if (key === 'Married') {
                    const checked = (val === 'true') ? 'checked' : '';
                    inputHtml = `<input type="checkbox" class="form-check-input" ${checked} />`;
                } else if (key === 'DateOfBirth') {
                    inputHtml = `<input type="date" class="form-control form-control-sm" value="${val}" />`;
                } else if (key === 'Salary') {
                    inputHtml = `<input type="number" step="0.01" class="form-control form-control-sm" value="${val.replace(",", ".") }" />`;
                } else {
                    inputHtml = `<input type="text" class="form-control form-control-sm" value="${val}" />`;
                }
                td.dataset.original = val;
                td.innerHTML = inputHtml;
            });

        } else if (btn.classList.contains('save')) {
            const payload = { id };
            row.querySelectorAll('.cell').forEach(td => {
                const key = td.dataset.key;
                const input = td.querySelector('input,select');
                let value = input?.value ?? '';
                if (key === 'Id') value = td.dataset.original;
                if (input && input.type === 'checkbox') value = input.checked;
                if (key === 'Salary') value = value === '' ? null : parseFloat(value).toFixed(2);
                if (key === 'DateOfBirth') value = value === '' ? null : value; // yyyy-MM-dd
                payload[key] = value;
                td.textContent = value;
            });

            try {
                const res = await fetch('/Contact/Update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const text = await res.text();
                    alert('Update failed: ' + text);
                    return;
                }
                const updated = await res.json();
                // write back
                row.classList.remove('editing');
                row.querySelectorAll('.cell').forEach(td => {
                    const key = td.dataset.key;
                    let val = updated[key];
                    if (key === 'DateOfBirth' && val) val = new Date(val).toISOString().slice(0, 10);
                    if (key === 'Married') val = (val ? 'true' : 'false');
                    if (key === 'Salary' && val != null) val = parseFloat(val).toFixed(2);
                });
                btn.classList.remove('save');
                btn.classList.add('edit');
                btn.textContent = 'Edit';
                btn.blur();
                const cancelBtn = row.querySelector('.cancel');
                cancelBtn.textContent = 'Delete';
                cancelBtn.classList.add('delete');
                cancelBtn.classList.remove('cancel');
                loadContacts();
            } catch (err) {
                alert('Error: ' + err);
            }

        } else if (btn.classList.contains('delete')) {
            if (!confirm('Delete this contact?')) return;
            try {
                const res = await fetch(`/Contact/Delete?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(await res.text());
                row.remove();
                loadContacts();
            } catch (err) {
                alert('Delete failed: ' + err);
            }

        } else if (btn.classList.contains('cancel')) {
            // cancel edit
            row.classList.remove('editing');
            row.querySelectorAll('.cell').forEach(td => {
                td.textContent = td.dataset.original || '';
                delete td.dataset.original;
            });
            btn.textContent = 'Delete';
            btn.classList.add('delete');
            btn.classList.remove('cancel');
            btn.blur();
            const editBtn = row.querySelector('.save');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit');
            editBtn.classList.remove('save');
        }
    });


    loadContacts();
})();
