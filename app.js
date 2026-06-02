"use strict";

const STORAGE_KEY = "senatran-app";

const state = {
  data: {
    placas: [],
  },
  editingItems: [],
  formErrors: {
    placa: "",
    items: [],
  },
  filterValue: "",
  selectedPlateIds: [],
  editingPlateId: null,
  pendingDeletePlateId: null,
};

const el = {
  backToOriginLink: document.getElementById("backToOriginLink"),
  placaInput: document.getElementById("placaInput"),
  placaError: document.getElementById("placaError"),
  formModeLabel: document.getElementById("formModeLabel"),
  duplicateItemBtn: document.getElementById("duplicateItemBtn"),
  dataItemsContainer: document.getElementById("dataItemsContainer"),
  savePlateBtn: document.getElementById("savePlateBtn"),
  clearItemsBtn: document.getElementById("clearItemsBtn"),
  confirmClearModal: document.getElementById("confirmClearModal"),
  cancelClearBtn: document.getElementById("cancelClearBtn"),
  confirmClearBtn: document.getElementById("confirmClearBtn"),
  saveSuccessModal: document.getElementById("saveSuccessModal"),
  saveSuccessText: document.getElementById("saveSuccessText"),
  closeSaveSuccessBtn: document.getElementById("closeSaveSuccessBtn"),
  message: document.getElementById("message"),
  filterInput: document.getElementById("filterInput"),
  clearFilterBtn: document.getElementById("clearFilterBtn"),
  exportDropdownBtn: document.getElementById("exportDropdownBtn"),
  exportDropdownMenu: document.getElementById("exportDropdownMenu"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  exportExcelBtn: document.getElementById("exportExcelBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  selectAllCheckbox: document.getElementById("selectAllCheckbox"),
  platesSelectionBody: document.getElementById("platesSelectionBody"),
  itemsModal: document.getElementById("itemsModal"),
  closeItemsModalBtn: document.getElementById("closeItemsModalBtn"),
  itemsModalTitle: document.getElementById("itemsModalTitle"),
  itemsModalBody: document.getElementById("itemsModalBody"),
  confirmDeletePlateModal: document.getElementById("confirmDeletePlateModal"),
  cancelDeletePlateBtn: document.getElementById("cancelDeletePlateBtn"),
  confirmDeletePlateBtn: document.getElementById("confirmDeletePlateBtn"),
  editPlatesBody: document.getElementById("editPlatesBody"),
};

function normalizePlate(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function formatDateDisplay(value) {
  if (!value) return "-";
  return value;
}

function formatPlateMask(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

function setMessage(text, type) {
  if (!el.message) return;
  el.message.textContent = text;
  el.message.classList.remove("success", "error");
  if (type) {
    el.message.classList.add(type);
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function generateUuid() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  const now = Date.now().toString(16);
  const rnd = Math.floor(Math.random() * 1e9).toString(16);
  return `fallback-${now}-${rnd}`;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.placas)) {
      return;
    }
    state.data = {
      placas: parsed.placas
        .filter(
          (item) =>
            item &&
            typeof item.placa === "string" &&
            Array.isArray(item.dados) &&
            typeof item.id === "string"
        )
        .map((item) => ({
          id: item.id,
          placa: normalizePlate(item.placa),
          createdAt: String(item.createdAt || ""),
          dados: item.dados.map(normalizeDataItem).filter(Boolean),
        })),
    };
  } catch (error) {
    setMessage("Falha ao carregar localStorage. Dados foram ignorados.", "error");
  }
}

function normalizeDataItem(item) {
  if (!item) {
    return null;
  }
  return {
    ait: String(item.ait || "").trim(),
    codigoInfracaoTipificacao: String(item.codigoInfracaoTipificacao || "").trim(),
    dataInicialVigenciaContrato: String(item.dataInicialVigenciaContrato || "").trim(),
    dataFinalVigencia: String(item.dataFinalVigencia || "").trim(),
    aditivoDataInicial: String(item.aditivoDataInicial || "").trim(),
    aditivoDataFinal: String(item.aditivoDataFinal || "").trim(),
  };
}

function createEmptyDataItem() {
  return {
    ait: "",
    codigoInfracaoTipificacao: "",
    dataInicialVigenciaContrato: "",
    dataFinalVigencia: "",
    aditivoDataInicial: "",
    aditivoDataFinal: "",
  };
}

function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) {
    return true;
  }
  return startDate <= endDate;
}

function renderEditingItems() {
  if (!el.dataItemsContainer) return;
  el.dataItemsContainer.innerHTML = "";

  state.editingItems.forEach((item, index) => {
    const itemErrors = state.formErrors.items[index] || {};
    const wrapper = document.createElement("div");
    wrapper.className = "data-item-card";
    wrapper.innerHTML = `
      <div class="data-item-title">
        <span>Dados ${index + 1}</span>
        <button type="button" class="item-remove-btn" data-remove-item-index="${index}">Excluir</button>
      </div>
      <div class="grid twelve-col">
        <label class="span-6">
          AIT
          <input type="text" data-index="${index}" data-field="ait" value="${item.ait}" />
          <span class="field-error">${itemErrors.ait || ""}</span>
        </label>
        <label class="span-6">
          Codigo infracao/tipificacao
          <input
            type="text"
            data-index="${index}"
            data-field="codigoInfracaoTipificacao"
            value="${item.codigoInfracaoTipificacao}"
          />
          <span class="field-error">${itemErrors.codigoInfracaoTipificacao || ""}</span>
        </label>
        <label class="span-6">
          Data inicial vigencia contrato
          <input
            type="date"
            data-index="${index}"
            data-field="dataInicialVigenciaContrato"
            value="${item.dataInicialVigenciaContrato}"
          />
          <span class="field-error"></span>
        </label>
        <label class="span-6">
          Data final vigencia
          <input
            type="date"
            data-index="${index}"
            data-field="dataFinalVigencia"
            value="${item.dataFinalVigencia}"
          />
          <span class="field-error"></span>
        </label>
        <label class="span-6">
          Aditivo data inicial
          <input
            type="date"
            data-index="${index}"
            data-field="aditivoDataInicial"
            value="${item.aditivoDataInicial}"
          />
          <span class="field-error"></span>
        </label>
        <label class="span-6">
          Aditivo data final
          <input
            type="date"
            data-index="${index}"
            data-field="aditivoDataFinal"
            value="${item.aditivoDataFinal}"
          />
          <span class="field-error"></span>
        </label>
      </div>
    `;
    el.dataItemsContainer.appendChild(wrapper);
  });
}

function duplicateEmptyItem() {
  syncEditingItemsFromInputs();
  state.editingItems.push(createEmptyDataItem());
  renderEditingItems();
}

function removeItemByIndex(index) {
  syncEditingItemsFromInputs();
  if (state.editingItems.length <= 1) {
    setMessage("Mantenha ao menos um DataItem para preenchimento.", "error");
    return;
  }
  state.editingItems = state.editingItems.filter((_, i) => i !== index);
  renderEditingItems();
}

function resetFormToCreateMode() {
  state.editingPlateId = null;
  state.formErrors = { placa: "", items: [] };
  if (el.formModeLabel) el.formModeLabel.textContent = "Modo: novo cadastro";
  if (el.placaInput) el.placaInput.value = "";
  if (el.placaError) el.placaError.textContent = "";
  state.editingItems = [createEmptyDataItem()];
  renderEditingItems();
}

function syncEditingItemsFromInputs() {
  if (!el.dataItemsContainer) return;
  const inputs = el.dataItemsContainer.querySelectorAll("input[data-index][data-field]");
  const updated = state.editingItems.map(() => createEmptyDataItem());

  inputs.forEach((input) => {
    const index = Number(input.dataset.index);
    const field = input.dataset.field;
    if (Number.isInteger(index) && updated[index] && field in updated[index]) {
      updated[index][field] = String(input.value || "").trim();
    }
  });

  state.editingItems = updated.map(normalizeDataItem);
}

function validateEditingItems(items) {
  state.formErrors = {
    placa: "",
    items: items.map(() => ({ ait: "", codigoInfracaoTipificacao: "" })),
  };
  let hasError = false;

  if (!normalizePlate(el.placaInput ? el.placaInput.value : "")) {
    state.formErrors.placa = "Placa e obrigatoria.";
    hasError = true;
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.ait) {
      state.formErrors.items[index].ait = "AIT e obrigatorio.";
      hasError = true;
    }
    if (!item.codigoInfracaoTipificacao) {
      state.formErrors.items[index].codigoInfracaoTipificacao = "Codigo infracao/tipificacao e obrigatorio.";
      hasError = true;
    }
    if (!isDateRangeValid(item.dataInicialVigenciaContrato, item.dataFinalVigencia)) {
      setMessage(`Data inicial da vigencia invalida no Dados ${index + 1}.`, "error");
      hasError = true;
      break;
    }
    if (!isDateRangeValid(item.aditivoDataInicial, item.aditivoDataFinal)) {
      setMessage(`Data inicial do aditivo invalida no Dados ${index + 1}.`, "error");
      hasError = true;
      break;
    }
  }

  if (el.placaError) {
    el.placaError.textContent = state.formErrors.placa || "";
  }
  renderEditingItems();
  return !hasError;
}

function savePlateWithItems() {
  if (!el.placaInput) return;
  const placa = normalizePlate(el.placaInput.value);
  if (!placa) {
    setMessage("Informe a placa antes de salvar.", "error");
    return;
  }

  syncEditingItemsFromInputs();
  const isValid = validateEditingItems(state.editingItems);
  if (!isValid) {
    return;
  }

  if (state.editingPlateId) {
    const plateToEdit = state.data.placas.find((item) => item.id === state.editingPlateId);
    if (!plateToEdit) {
      setMessage("Placa em edicao nao encontrada.", "error");
      return;
    }
    plateToEdit.placa = placa;
    plateToEdit.dados = [...state.editingItems];
    openSaveSuccessModal(`Placa ${placa} atualizada com sucesso.`);
  } else {
    state.data.placas.push({
      id: generateUuid(),
      placa,
      createdAt: new Date().toISOString(),
      dados: [...state.editingItems],
    });
    openSaveSuccessModal(`Placa ${placa} salva com sucesso.`);
  }

  saveToStorage();
  renderVisualizar();
  renderEditar();
  resetFormToCreateMode();
}

function clearEditingItems() {
  resetFormToCreateMode();
}

function openConfirmClearModal() {
  if (!el.confirmClearModal) return;
  el.confirmClearModal.classList.remove("hidden");
}

function closeConfirmClearModal() {
  if (!el.confirmClearModal) return;
  el.confirmClearModal.classList.add("hidden");
}

function openSaveSuccessModal(message) {
  if (!el.saveSuccessModal || !el.saveSuccessText) return;
  el.saveSuccessText.textContent = message;
  el.saveSuccessModal.classList.remove("hidden");
}

function closeSaveSuccessModal() {
  if (!el.saveSuccessModal) return;
  el.saveSuccessModal.classList.add("hidden");
}

function getFlatRows(placas) {
  return placas.flatMap((plate) =>
    plate.dados.map((item) => ({
      id: plate.id,
      placa: plate.placa,
      ait: item.ait,
      codigoInfracaoTipificacao: item.codigoInfracaoTipificacao,
      dataInicialVigenciaContrato: item.dataInicialVigenciaContrato,
      dataFinalVigencia: item.dataFinalVigencia,
      aditivoDataInicial: item.aditivoDataInicial,
      aditivoDataFinal: item.aditivoDataFinal,
    }))
  );
}

function getGroupedRowsForExport(placas) {
  return placas.flatMap((plate) => {
    if (!Array.isArray(plate.dados) || !plate.dados.length) {
      return [];
    }
    return plate.dados.map((item, index) => ({
      placa: index === 0 ? plate.placa : "",
      ait: item.ait,
      codigoInfracaoTipificacao: item.codigoInfracaoTipificacao,
      dataInicialVigenciaContrato: item.dataInicialVigenciaContrato,
      dataFinalVigencia: item.dataFinalVigencia,
      aditivoDataInicial: item.aditivoDataInicial,
      aditivoDataFinal: item.aditivoDataFinal,
    }));
  });
}

function getFilteredPlates() {
  const filter = normalizePlate(state.filterValue);
  if (!filter) {
    return state.data.placas;
  }
  return state.data.placas.filter((item) => item.placa.includes(filter));
}

function getSelectedPlates() {
  return state.data.placas.filter((item) => state.selectedPlateIds.includes(item.id));
}

function renderPlatesSelectionTable() {
  if (!el.platesSelectionBody) return;
  const filtered = getFilteredPlates();
  el.platesSelectionBody.innerHTML = "";

  if (!filtered.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="5">Nenhuma placa encontrada.</td>';
    el.platesSelectionBody.appendChild(tr);
    return;
  }

  filtered.forEach((plate) => {
    const checked = state.selectedPlateIds.includes(plate.id) ? "checked" : "";
    const createdAt = plate.createdAt ? new Date(plate.createdAt).toLocaleString("pt-BR") : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" data-select-plate-id="${plate.id}" ${checked} /></td>
      <td>${plate.placa}</td>
      <td>${plate.dados.length}</td>
      <td>${createdAt}</td>
      <td>
        <div class="inline-actions">
          <button type="button" class="secondary" data-view-items-id="${plate.id}">Visualizar</button>
          <button type="button" class="secondary" data-edit-plate-id="${plate.id}">Editar</button>
          <button type="button" class="danger" data-delete-plate-id="${plate.id}">Excluir</button>
        </div>
      </td>
    `;
    el.platesSelectionBody.appendChild(tr);
  });
  syncSelectAllCheckboxState();
}

function renderRecordsTable() {
  // Layout novo usa somente tabela de placas.
}

function renderEditPlatesTable() {
  if (!el.editPlatesBody) return;
  el.editPlatesBody.innerHTML = "";

  if (!state.data.placas.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">Nenhuma placa cadastrada.</td>';
    el.editPlatesBody.appendChild(tr);
    return;
  }

  state.data.placas.forEach((plate) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${plate.id}</td>
      <td>${plate.placa}</td>
      <td>${plate.dados.length}</td>
      <td>
        <div class="inline-actions">
          <button type="button" class="secondary" data-edit-plate-id="${plate.id}">Editar</button>
          <button type="button" class="secondary" data-delete-plate-id="${plate.id}">Excluir</button>
        </div>
      </td>
    `;
    el.editPlatesBody.appendChild(tr);
  });
}

function renderVisualizar() {
  renderPlatesSelectionTable();
}

function renderEditar() {
  renderEditPlatesTable();
}

function onFilterInput(event) {
  state.filterValue = event.target.value || "";
  renderVisualizar();
}

function clearFilter() {
  state.filterValue = "";
  if (el.filterInput) el.filterInput.value = "";
  renderVisualizar();
}

function selectFilteredPlates() {
  const filtered = getFilteredPlates();
  state.selectedPlateIds = Array.from(new Set([...state.selectedPlateIds, ...filtered.map((p) => p.id)]));
  renderPlatesSelectionTable();
}

function clearSelection() {
  state.selectedPlateIds = [];
  renderPlatesSelectionTable();
}

function onSelectionTableChange(event) {
  const plateId = event.target.dataset.selectPlateId;
  if (!plateId) return;

  if (event.target.checked) {
    if (!state.selectedPlateIds.includes(plateId)) {
      state.selectedPlateIds.push(plateId);
    }
  } else {
    state.selectedPlateIds = state.selectedPlateIds.filter((id) => id !== plateId);
  }
  syncSelectAllCheckboxState();
}

function toggleSelectAllFilteredPlates() {
  const filteredIds = getFilteredPlates().map((item) => item.id);
  if (!filteredIds.length) return;

  const allSelected = filteredIds.every((id) => state.selectedPlateIds.includes(id));
  if (allSelected) {
    state.selectedPlateIds = state.selectedPlateIds.filter((id) => !filteredIds.includes(id));
  } else {
    state.selectedPlateIds = Array.from(new Set([...state.selectedPlateIds, ...filteredIds]));
  }
  renderPlatesSelectionTable();
}

function syncSelectAllCheckboxState() {
  if (!el.selectAllCheckbox) return;
  const filteredIds = getFilteredPlates().map((item) => item.id);
  if (!filteredIds.length) {
    el.selectAllCheckbox.checked = false;
    el.selectAllCheckbox.indeterminate = false;
    return;
  }
  const selectedCount = filteredIds.filter((id) => state.selectedPlateIds.includes(id)).length;
  el.selectAllCheckbox.checked = selectedCount === filteredIds.length;
  el.selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < filteredIds.length;
}

function convertRowsForExport(rows) {
  return rows.map((row) => ({
    Placa: row.placa,
    AIT: row.ait,
    Codigo_Infracao_Tipificacao: row.codigoInfracaoTipificacao,
    Data_Inicial_Vigencia_Contrato: row.dataInicialVigenciaContrato,
    Data_Final_Vigencia: row.dataFinalVigencia,
    Aditivo_Data_Inicial: row.aditivoDataInicial,
    Aditivo_Data_Final: row.aditivoDataFinal,
  }));
}

function getExportRowsBySelectionOrAll() {
  const selected = getSelectedPlates();
  const platesToExport = selected.length ? selected : state.data.placas;
  return getGroupedRowsForExport(platesToExport);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function exportCSV(rows, fileName) {
  if (!rows.length) {
    setMessage("Sem dados para exportar em CSV.", "error");
    return;
  }
  const headers = [
    "Placa",
    "AIT",
    "Codigo Infracao/Tipificacao",
    "Data Inicial Vigencia Contrato",
    "Data Final Vigencia",
    "Aditivo Data Inicial",
    "Aditivo Data Final",
  ];
  const csvRows = rows.map((row) =>
    [
      row.placa,
      row.ait,
      row.codigoInfracaoTipificacao,
      row.dataInicialVigenciaContrato,
      row.dataFinalVigencia,
      row.aditivoDataInicial,
      row.aditivoDataFinal,
    ]
      .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
      .join(";")
  );
  const csvText = [headers.join(";"), ...csvRows].join("\n");
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, fileName);
  setMessage(`Arquivo CSV exportado: ${fileName}`, "success");
}

function exportExcel(rows, fileName) {
  if (!rows.length) {
    setMessage("Sem dados para exportar em Excel.", "error");
    return;
  }
  if (!window.XLSX) {
    setMessage("Biblioteca Excel nao carregada.", "error");
    return;
  }
  const worksheet = window.XLSX.utils.json_to_sheet(convertRowsForExport(rows));
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  window.XLSX.writeFile(workbook, fileName);
  setMessage(`Arquivo Excel exportado: ${fileName}`, "success");
}

function exportPDF(rows, fileName) {
  if (!rows.length) {
    setMessage("Sem dados para exportar em PDF.", "error");
    return;
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    setMessage("Biblioteca PDF nao carregada.", "error");
    return;
  }

  const doc = new window.jspdf.jsPDF({ orientation: "landscape" });
  doc.autoTable({
    startY: 12,
    head: [
      [
        "Placa",
        "AIT",
        "Codigo Infracao Tipificacao",
        "Data Inicial Vigencia Contrato",
        "Data Final Vigencia",
        "Aditivo Data Inicial",
        "Aditivo Data Final",
      ],
    ],
    body: rows.map((row) => [
      row.placa,
      row.ait,
      row.codigoInfracaoTipificacao,
      row.dataInicialVigenciaContrato,
      row.dataFinalVigencia,
      row.aditivoDataInicial,
      row.aditivoDataFinal,
    ]),
    styles: { fontSize: 8 },
  });
  doc.save(fileName);
  setMessage(`Arquivo PDF exportado: ${fileName}`, "success");
}

function getRowsForExport(mode) {
  let plates = state.data.placas;
  if (mode === "filtered") {
    plates = getFilteredPlates();
  } else if (mode === "selected") {
    plates = getSelectedPlates();
  }
  return getFlatRows(plates);
}

function startEditingPlate(plateId) {
  const plate = state.data.placas.find((item) => item.id === plateId);
  if (!plate) {
    setMessage("Placa nao encontrada para edicao.", "error");
    return;
  }
  const originPage = window.location.pathname.split("/").pop() || "index.html";
  window.location.href =
    `criar-cadastro.html?editId=${encodeURIComponent(plate.id)}&from=${encodeURIComponent(originPage)}`;
}

function openItemsModal(plateId) {
  if (!el.itemsModal || !el.itemsModalBody) return;
  const plate = state.data.placas.find((item) => item.id === plateId);
  if (!plate) {
    setMessage("Placa nao encontrada para visualizar itens.", "error");
    return;
  }
  if (el.itemsModalTitle) {
    el.itemsModalTitle.textContent = `Itens cadastrados - ${plate.placa}`;
  }
  el.itemsModalBody.innerHTML = "";

  if (!plate.dados.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="6">Nenhum item cadastrado.</td>';
    el.itemsModalBody.appendChild(tr);
  } else {
    plate.dados.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.ait}</td>
        <td>${item.codigoInfracaoTipificacao}</td>
        <td>${formatDateDisplay(item.dataInicialVigenciaContrato)}</td>
        <td>${formatDateDisplay(item.dataFinalVigencia)}</td>
        <td>${formatDateDisplay(item.aditivoDataInicial)}</td>
        <td>${formatDateDisplay(item.aditivoDataFinal)}</td>
      `;
      el.itemsModalBody.appendChild(tr);
    });
  }

  el.itemsModal.classList.remove("hidden");
}

function closeItemsModal() {
  if (!el.itemsModal) return;
  el.itemsModal.classList.add("hidden");
}

function openConfirmDeletePlateModal(plateId) {
  if (!el.confirmDeletePlateModal) return;
  state.pendingDeletePlateId = plateId;
  el.confirmDeletePlateModal.classList.remove("hidden");
}

function closeConfirmDeletePlateModal() {
  if (!el.confirmDeletePlateModal) return;
  state.pendingDeletePlateId = null;
  el.confirmDeletePlateModal.classList.add("hidden");
}

function confirmDeleteSelectedPlate() {
  if (!state.pendingDeletePlateId) return;
  deletePlate(state.pendingDeletePlateId);
  closeConfirmDeletePlateModal();
}

function deletePlate(plateId) {
  const target = state.data.placas.find((item) => item.id === plateId);
  if (!target) {
    setMessage("Placa nao encontrada para exclusao.", "error");
    return;
  }
  state.data.placas = state.data.placas.filter((item) => item.id !== plateId);
  state.selectedPlateIds = state.selectedPlateIds.filter((id) => id !== plateId);
  if (state.editingPlateId === plateId) {
    resetFormToCreateMode();
  }
  saveToStorage();
  renderVisualizar();
  renderEditar();
  setMessage(`Placa ${target.placa} excluida com sucesso.`, "success");
}

function onEditTableClick(event) {
  const editId = event.target.dataset.editPlateId;
  const deleteId = event.target.dataset.deletePlateId;

  if (editId) {
    startEditingPlate(editId);
  } else if (deleteId) {
    deletePlate(deleteId);
  }
}

function onVisualizarTableClick(event) {
  const editId = event.target.dataset.editPlateId;
  const viewId = event.target.dataset.viewItemsId;
  const deleteId = event.target.dataset.deletePlateId;
  if (viewId) {
    openItemsModal(viewId);
  } else if (editId) {
    startEditingPlate(editId);
  } else if (deleteId) {
    openConfirmDeletePlateModal(deleteId);
  }
}

function onEditingItemsClick(event) {
  const removeIndexRaw = event.target.dataset.removeItemIndex;
  if (removeIndexRaw === undefined) return;
  const index = Number(removeIndexRaw);
  if (!Number.isInteger(index)) return;
  removeItemByIndex(index);
}

function toggleExportDropdown() {
  if (!el.exportDropdownMenu) return;
  el.exportDropdownMenu.classList.toggle("open");
}

function closeExportDropdown() {
  if (!el.exportDropdownMenu) return;
  el.exportDropdownMenu.classList.remove("open");
}

function registerEvents() {
  if (el.duplicateItemBtn) el.duplicateItemBtn.addEventListener("click", duplicateEmptyItem);
  if (el.dataItemsContainer) el.dataItemsContainer.addEventListener("click", onEditingItemsClick);
  if (el.savePlateBtn) el.savePlateBtn.addEventListener("click", savePlateWithItems);
  if (el.clearItemsBtn) el.clearItemsBtn.addEventListener("click", openConfirmClearModal);
  if (el.cancelClearBtn) el.cancelClearBtn.addEventListener("click", closeConfirmClearModal);
  if (el.confirmClearBtn) {
    el.confirmClearBtn.addEventListener("click", () => {
      clearEditingItems();
      closeConfirmClearModal();
    });
  }
  if (el.confirmClearModal) {
    el.confirmClearModal.addEventListener("click", (event) => {
      if (event.target === el.confirmClearModal) closeConfirmClearModal();
    });
  }
  if (el.closeSaveSuccessBtn) el.closeSaveSuccessBtn.addEventListener("click", closeSaveSuccessModal);
  if (el.saveSuccessModal) {
    el.saveSuccessModal.addEventListener("click", (event) => {
      if (event.target === el.saveSuccessModal) closeSaveSuccessModal();
    });
  }

  if (el.filterInput) el.filterInput.addEventListener("input", onFilterInput);
  if (el.selectAllCheckbox) {
    el.selectAllCheckbox.addEventListener("change", () => {
      toggleSelectAllFilteredPlates();
    });
  }
  if (el.placaInput) {
    el.placaInput.addEventListener("input", (event) => {
      event.target.value = formatPlateMask(event.target.value);
      if (el.placaError) el.placaError.textContent = "";
    });
  }
  if (el.clearFilterBtn) el.clearFilterBtn.addEventListener("click", clearFilter);
  if (el.platesSelectionBody) el.platesSelectionBody.addEventListener("change", onSelectionTableChange);
  if (el.platesSelectionBody) el.platesSelectionBody.addEventListener("click", onVisualizarTableClick);
  if (el.editPlatesBody) el.editPlatesBody.addEventListener("click", onEditTableClick);
  if (el.closeItemsModalBtn) el.closeItemsModalBtn.addEventListener("click", closeItemsModal);
  if (el.itemsModal) {
    el.itemsModal.addEventListener("click", (event) => {
      if (event.target === el.itemsModal) closeItemsModal();
    });
  }
  if (el.exportDropdownBtn) el.exportDropdownBtn.addEventListener("click", toggleExportDropdown);
  if (el.cancelDeletePlateBtn) el.cancelDeletePlateBtn.addEventListener("click", closeConfirmDeletePlateModal);
  if (el.confirmDeletePlateBtn) el.confirmDeletePlateBtn.addEventListener("click", confirmDeleteSelectedPlate);
  if (el.confirmDeletePlateModal) {
    el.confirmDeletePlateModal.addEventListener("click", (event) => {
      if (event.target === el.confirmDeletePlateModal) closeConfirmDeletePlateModal();
    });
  }
  if (el.exportCsvBtn) {
    el.exportCsvBtn.addEventListener("click", () => {
      exportCSV(getExportRowsBySelectionOrAll(), "senatran_exportacao.csv");
      closeExportDropdown();
    });
  }
  if (el.exportExcelBtn) {
    el.exportExcelBtn.addEventListener("click", () => {
      exportExcel(getExportRowsBySelectionOrAll(), "senatran_exportacao.xlsx");
      closeExportDropdown();
    });
  }
  if (el.exportPdfBtn) {
    el.exportPdfBtn.addEventListener("click", () => {
      exportPDF(getExportRowsBySelectionOrAll(), "senatran_exportacao.pdf");
      closeExportDropdown();
    });
  }
  document.addEventListener("click", (event) => {
    if (!el.exportDropdownMenu || !el.exportDropdownBtn) return;
    const clickedInsideMenu = el.exportDropdownMenu.contains(event.target);
    const clickedButton = el.exportDropdownBtn.contains(event.target);
    if (!clickedInsideMenu && !clickedButton) {
      closeExportDropdown();
    }
  });

}

function applyEditModeFromQuery() {
  if (!el.placaInput) return;
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("editId");
  if (!editId) return;
  const plate = state.data.placas.find((item) => item.id === editId);
  if (!plate) {
    setMessage("Cadastro para edicao nao encontrado.", "error");
    return;
  }
  state.editingPlateId = plate.id;
  if (el.formModeLabel) {
    el.formModeLabel.textContent = `Modo: editando placa ${plate.placa} (${plate.id})`;
  }
  el.placaInput.value = plate.placa;
  state.editingItems = plate.dados.map((item) => normalizeDataItem(item));
  renderEditingItems();
}

function applyBackLinkFromQuery() {
  if (!el.backToOriginLink) return;
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");
  const allowed = new Set(["index.html", "visualizar-placas.html", "editar-placas.html"]);
  if (from && allowed.has(from)) {
    el.backToOriginLink.href = from;
    return;
  }
  el.backToOriginLink.href = "index.html";
}

function init() {
  loadFromStorage();
  if (el.placaInput) {
    applyBackLinkFromQuery();
    resetFormToCreateMode();
    applyEditModeFromQuery();
  }
  renderVisualizar();
  renderEditar();
  registerEvents();
}

init();
