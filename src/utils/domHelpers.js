// domHelpers.js - Funciones para creación y manipulación del DOM

// Estado de colapso por módulo (persistente en sesión)
const collapsedModules = new Set();

// Cargar estado de colapso desde localStorage
function loadCollapsedState() {
  try {
    const saved = localStorage.getItem('actols_collapsed_modules');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.forEach(id => collapsedModules.add(id));
    }
  } catch (e) { /* ignore */ }
}

// Guardar estado de colapso en localStorage
function saveCollapsedState() {
  try {
    localStorage.setItem('actols_collapsed_modules', JSON.stringify(Array.from(collapsedModules)));
  } catch (e) { /* ignore */ }
}

// Cargar estado al inicio
loadCollapsedState();

export function createModuleCard(module, currency, convertFn, formatFn) {
  const { id, description, price } = module;
  const priceConverted = convertFn(price, currency);
  const priceFormatted = formatFn(priceConverted, currency);
  
  const isCollapsed = collapsedModules.has(id);

  const card = document.createElement('div');
  card.className = 'module-card';
  if (isCollapsed) card.classList.add('collapsed');
  card.dataset.id = id;
  card.dataset.categoryId = module.category_id || '';

  // Wrapper para el checkbox (siempre visible)
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'module-checkbox-wrapper';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.dataset.id = id;
  checkbox.id = `mod-${id}`;
  checkbox.setAttribute('aria-label', `Seleccionar ${description}`);
  checkboxWrapper.appendChild(checkbox);

  // Contenido colapsable
  const content = document.createElement('div');
  content.className = 'module-content';
  if (isCollapsed) content.classList.add('collapsed');

  const label = document.createElement('span');
  label.className = 'module-label';
  label.textContent = description;

  const priceSpan = document.createElement('span');
  priceSpan.className = 'module-price';
  priceSpan.textContent = priceFormatted;

  // Botón de toggle (flecha)
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'module-toggle';
  if (isCollapsed) toggleBtn.classList.add('collapsed');
  toggleBtn.setAttribute('aria-label', isCollapsed ? 'Expandir servicio' : 'Colapsar servicio');
  toggleBtn.type = 'button';
  
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = '▼';
  toggleBtn.appendChild(arrow);

  // Evento toggle
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleModule(card, content, toggleBtn, id);
  });

  // También toggle al hacer clic en la card (excepto en checkbox)
  card.addEventListener('click', (e) => {
    // Si el clic fue en el checkbox o en el botón toggle, no hacer nada
    if (e.target.closest('input[type="checkbox"]') || e.target.closest('.module-toggle')) {
      return;
    }
    toggleModule(card, content, toggleBtn, id);
  });

  content.appendChild(label);
  content.appendChild(priceSpan);

  card.appendChild(checkboxWrapper);
  card.appendChild(content);
  card.appendChild(toggleBtn);

  return card;
}

function toggleModule(card, content, toggleBtn, id) {
  const isCollapsed = card.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
  toggleBtn.classList.toggle('collapsed');
  
  toggleBtn.setAttribute('aria-label', isCollapsed ? 'Expandir servicio' : 'Colapsar servicio');
  
  if (isCollapsed) {
    collapsedModules.add(id);
  } else {
    collapsedModules.delete(id);
  }
  saveCollapsedState();
}

export function renderModulesByCategory(container, modules, categories, currency, convertFn, formatFn) {
  container.innerHTML = '';
  if (!categories || categories.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No hay categorías. Agrega una desde el modo Editar.';
    container.appendChild(msg);
    return;
  }
  const grouped = {};
  categories.forEach(cat => {
    grouped[cat.id] = {
      category: cat,
      modules: modules.filter(m => m.category_id === cat.id) || []
    };
  });
  for (const catId in grouped) {
    const { category, modules: mods } = grouped[catId];
    const section = document.createElement('div');
    section.className = 'category-section';
    section.dataset.categoryId = category.id;

    const header = document.createElement('div');
    header.className = 'category-header';
    const title = document.createElement('h3');
    title.textContent = category.name;
    header.appendChild(title);
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'module-list';
    list.dataset.categoryId = category.id;

    if (mods.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'No hay módulos en esta categoría.';
      list.appendChild(empty);
    } else {
      mods.forEach(mod => {
        const card = createModuleCard(mod, currency, convertFn, formatFn);
        list.appendChild(card);
      });
    }
    section.appendChild(list);
    container.appendChild(section);
  }
}

export function createAdminModuleCard(module, onDelete, onEdit) {
  const { id, description, price } = module;
  const card = document.createElement('div');
  card.className = 'module-card admin-mode';
  card.dataset.id = id;
  card.dataset.categoryId = module.category_id || '';

  // En modo administración NO hay toggle, solo el contenido completo
  const content = document.createElement('div');
  content.className = 'module-content';
  content.style.maxHeight = 'none';
  content.style.opacity = '1';
  content.style.marginLeft = '0';

  const info = document.createElement('span');
  info.className = 'module-label';
  info.textContent = description;

  const priceSpan = document.createElement('span');
  priceSpan.className = 'module-price';
  priceSpan.textContent = `$ ${Number(price).toLocaleString('es-CO')}`;

  const actions = document.createElement('div');
  actions.className = 'admin-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-edit';
  editBtn.textContent = 'Editar';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onEdit(id);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onDelete(id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  content.appendChild(info);
  content.appendChild(priceSpan);
  content.appendChild(actions);

  card.appendChild(content);

  return card;
}

export function renderAdminModulesByCategory(container, modules, categories, onDeleteModule, onEditModule, onEditCategory, onDeleteCategory) {
  container.innerHTML = '';
  if (!categories || categories.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No hay categorías. Agrega una.';
    container.appendChild(msg);
    return;
  }
  const grouped = {};
  categories.forEach(cat => {
    grouped[cat.id] = {
      category: cat,
      modules: modules.filter(m => m.category_id === cat.id) || []
    };
  });
  for (const catId in grouped) {
    const { category, modules: mods } = grouped[catId];
    const section = document.createElement('div');
    section.className = 'category-section';
    section.dataset.categoryId = category.id;

    const header = document.createElement('div');
    header.className = 'category-header';

    const title = document.createElement('h3');
    title.textContent = category.name;
    header.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'category-actions';

    const editCatBtn = document.createElement('button');
    editCatBtn.className = 'btn btn-edit-cat';
    editCatBtn.textContent = 'Editar';
    editCatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onEditCategory(category.id);
    });

    const deleteCatBtn = document.createElement('button');
    deleteCatBtn.className = 'btn btn-delete-cat';
    deleteCatBtn.textContent = 'Eliminar';
    deleteCatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDeleteCategory(category.id);
    });

    actions.appendChild(editCatBtn);
    actions.appendChild(deleteCatBtn);
    header.appendChild(actions);
    section.appendChild(header);

    const list = document.createElement('div');
    list.className = 'module-list';
    list.dataset.categoryId = category.id;

    if (mods.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'No hay módulos en esta categoría.';
      list.appendChild(empty);
    } else {
      mods.forEach(mod => {
        const card = createAdminModuleCard(mod, onDeleteModule, onEditModule);
        list.appendChild(card);
      });
    }
    section.appendChild(list);
    container.appendChild(section);
  }
}

// Función para colapsar todos los módulos (útil si quieres agregar un botón "Colapsar todos")
export function collapseAllModules() {
  // Esta función se puede llamar desde main.js si quieres agregar un botón
  document.querySelectorAll('.module-card:not(.admin-mode)').forEach(card => {
    const id = card.dataset.id;
    if (id && !collapsedModules.has(id)) {
      collapsedModules.add(id);
      card.classList.add('collapsed');
      const content = card.querySelector('.module-content');
      const toggle = card.querySelector('.module-toggle');
      if (content) content.classList.add('collapsed');
      if (toggle) toggle.classList.add('collapsed');
    }
  });
  saveCollapsedState();
}

// Función para expandir todos los módulos
export function expandAllModules() {
  document.querySelectorAll('.module-card:not(.admin-mode)').forEach(card => {
    const id = card.dataset.id;
    if (id && collapsedModules.has(id)) {
      collapsedModules.delete(id);
      card.classList.remove('collapsed');
      const content = card.querySelector('.module-content');
      const toggle = card.querySelector('.module-toggle');
      if (content) content.classList.remove('collapsed');
      if (toggle) toggle.classList.remove('collapsed');
    }
  });
  saveCollapsedState();
}
