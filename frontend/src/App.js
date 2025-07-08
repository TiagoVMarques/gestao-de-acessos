import React, { useState, useEffect, useRef, useMemo } from 'react';

const API_URL = 'http://localhost:4000/api'; // URL do nosso backend

const ACCESS_LEVELS = ['Nenhum', 'Básico', 'Intermediário', 'Administrador'];
const INITIAL_EMPLOYEE_STATE = { name: '', department: '', role: '', manager: '', softwareAccess: [] };

function App() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [softwareList, setSoftwareList] = useState([]);
    const [newEmployee, setNewEmployee] = useState(INITIAL_EMPLOYEE_STATE);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [newSoftwareName, setNewSoftwareName] = useState('');
    const [editingSoftware, setEditingSoftware] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterSoftware, setFilterSoftware] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const confirmModalRef = useRef(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    const fetchData = async () => {
        try {
            const [employeesRes, softwareRes] = await Promise.all([
                fetch(`${API_URL}/employees`),
                fetch(`${API_URL}/software`)
            ]);
            if (!employeesRes.ok || !softwareRes.ok) throw new Error('Erro de rede ao buscar dados.');
            const employeesData = await employeesRes.json();
            const softwareData = await softwareRes.json();
            setEmployees(employeesData);
            setSoftwareList(softwareData);
        } catch (err) {
            setError("Falha ao carregar dados do servidor. Verifique se o backend está a rodar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showConfirmModal = (message, action) => {
        setConfirmMessage(message);
        setConfirmAction(() => action);
        if (confirmModalRef.current) confirmModalRef.current.classList.remove('hidden');
    };
    const hideConfirmModal = () => { if (confirmModalRef.current) confirmModalRef.current.classList.add('hidden'); };
    const handleConfirm = () => { if (confirmAction) confirmAction(); hideConfirmModal(); };

    const handleEmployeeSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!newEmployee.name || !newEmployee.department || !newEmployee.role) { return setError("Nome, setor e cargo são obrigatórios."); }
        const isDuplicate = employees.some(emp => emp.name.toLowerCase() === newEmployee.name.toLowerCase() && emp.id !== editingEmployee?.id);
        if (isDuplicate) { return setError("Já existe um colaborador com este nome."); }

        const method = editingEmployee ? 'PUT' : 'POST';
        const url = editingEmployee ? `${API_URL}/employees/${editingEmployee.id}` : `${API_URL}/employees`;

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEmployee) });
            if (!response.ok) throw new Error('Falha ao salvar colaborador');
            fetchData();
            resetEmployeeForm();
        } catch (err) { setError("Ocorreu um erro ao salvar o colaborador."); }
    };

    const deleteEmployee = (employeeId) => {
        showConfirmModal("Tem certeza que deseja excluir este colaborador?", async () => {
            try {
                await fetch(`${API_URL}/employees/${employeeId}`, { method: 'DELETE' });
                fetchData();
            } catch (err) { setError("Ocorreu um erro ao excluir o colaborador."); }
        });
    };

    const handleSoftwareSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!newSoftwareName) { return setError("O nome do software é obrigatório."); }
        const isDuplicate = softwareList.some(soft => soft.name.toLowerCase() === newSoftwareName.toLowerCase() && soft.id !== editingSoftware?.id);
        if (isDuplicate) { return setError("Já existe um software com este nome."); }

        try {
            await fetch(`${API_URL}/software`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSoftwareName }) });
            fetchData();
            resetSoftwareForm();
        } catch (err) { setError("Ocorreu um erro ao salvar o software."); }
    };

    const deleteSoftware = (softwareId) => {
        const isInUse = employees.some(emp => emp.softwareAccess.some(sa => sa.softwareId === softwareId));
        if (isInUse) { return setError("Este software não pode ser excluído pois está em uso por um ou mais colaboradores."); }
        showConfirmModal("Tem certeza que deseja excluir este software?", async () => {
            try {
                await fetch(`${API_URL}/software/${softwareId}`, { method: 'DELETE' });
                fetchData();
            } catch (err) { setError("Ocorreu um erro ao excluir o software."); }
        });
    };

    const startEditEmployee = (employee) => {
        setEditingEmployee(employee);
        setNewEmployee({ ...INITIAL_EMPLOYEE_STATE, ...employee, softwareAccess: employee.softwareAccess || [] });
        setActiveTab('employees');
    };
    const resetEmployeeForm = () => { setEditingEmployee(null); setNewEmployee(INITIAL_EMPLOYEE_STATE); setError(null); };
    const handleAccessLevelChange = (softwareId, level) => {
        let updatedAccess = [...newEmployee.softwareAccess];
        const existingAccessIndex = updatedAccess.findIndex(sa => sa.softwareId === softwareId);
        if (level === 'Nenhum') {
            if (existingAccessIndex > -1) updatedAccess.splice(existingAccessIndex, 1);
        } else {
            if (existingAccessIndex > -1) updatedAccess[existingAccessIndex].level = level;
            else updatedAccess.push({ softwareId, level });
        }
        setNewEmployee({ ...newEmployee, softwareAccess: updatedAccess });
    };
    const startEditSoftware = (software) => { setEditingSoftware(software); setNewSoftwareName(software.name); };
    const resetSoftwareForm = () => { setEditingSoftware(null); setNewSoftwareName(''); setError(null); };

    const uniqueDepartments = useMemo(() => [...new Set(employees.map(emp => emp.department).filter(Boolean))].sort(), [employees]);
    const filteredEmployees = useMemo(() => employees.filter(emp =>
        (filterEmployee ? emp.id === parseInt(filterEmployee) : true) &&
        (filterSoftware ? emp.softwareAccess?.some(sa => sa.softwareId === parseInt(filterSoftware)) : true) &&
        (filterDepartment ? emp.department === filterDepartment : true)
    ), [employees, filterEmployee, filterSoftware, filterDepartment]);
    const getSoftwareName = (id) => softwareList.find(s => s.id === id)?.name || 'Desconhecido';

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-xl">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans">
            <div className="bg-gray-800 shadow-2xl rounded-2xl p-6 w-full max-w-7xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-400 mb-6 drop-shadow-lg">Sistema de Gestão de Acessos</h1>
                {error && (<div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-4"><span>{error}</span><button onClick={() => setError(null)} className="absolute top-1 right-2 text-xl">&times;</button></div>)}
                <div className="flex justify-center mb-8 border-b-2 border-gray-700">
                    {['overview', 'employees', 'software'].map(tab => (<button key={tab} className={`py-3 px-4 sm:px-6 text-lg sm:text-xl font-semibold rounded-t-xl transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg -mb-0.5' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'}`} onClick={() => setActiveTab(tab)}>{tab === 'overview' ? 'Visão Geral' : tab === 'employees' ? 'Colaboradores' : 'Softwares'}</button>))}
                </div>

                {activeTab === 'overview' && (
                    <div className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600">
                        <h2 className="text-2xl font-bold text-gray-200 mb-4">Visão Geral de Acessos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <select onChange={(e) => setFilterEmployee(e.target.value)} value={filterEmployee} className="p-3 bg-gray-800 border border-gray-600 rounded-lg"><option value="">Filtrar por Colaborador...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                            <select onChange={(e) => setFilterDepartment(e.target.value)} value={filterDepartment} className="p-3 bg-gray-800 border border-gray-600 rounded-lg"><option value="">Filtrar por Setor...</option>{uniqueDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
                            <select onChange={(e) => setFilterSoftware(e.target.value)} value={filterSoftware} className="p-3 bg-gray-800 border border-gray-600 rounded-lg"><option value="">Filtrar por Software...</option>{softwareList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </div>
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-600"><thead className="bg-gray-800"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Colaborador</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Setor</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Softwares com Acesso</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ações</th></tr></thead><tbody className="bg-gray-700 divide-y divide-gray-600">{filteredEmployees.map(emp => (<tr key={emp.id}><td className="px-6 py-4 whitespace-nowrap text-blue-300">{emp.name}</td><td className="px-6 py-4 whitespace-nowrap">{emp.department}</td><td className="px-6 py-4">{emp.softwareAccess?.map(sa => `${getSoftwareName(sa.softwareId)} (${sa.level})`).join(', ') || 'Nenhum'}</td><td className="px-6 py-4"><button onClick={() => startEditEmployee(emp)} className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700" title="Editar Colaborador">✏️</button></td></tr>))}</tbody></table>{filteredEmployees.length === 0 && <p className="text-center py-4 text-gray-400">Nenhum resultado encontrado.</p>}</div>
                    </div>
                )}

                {activeTab === 'employees' && (
                    <div className="space-y-8">
                        <form onSubmit={handleEmployeeSubmit} className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600">
                            <h2 className="text-2xl font-bold text-gray-200 mb-4">{editingEmployee ? 'Editar Colaborador' : 'Adicionar Colaborador'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input type="text" placeholder="Nome *" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} className="p-3 bg-gray-800 border border-gray-600 rounded-lg" />
                                <input type="text" placeholder="Setor *" value={newEmployee.department} onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} className="p-3 bg-gray-800 border border-gray-600 rounded-lg" />
                                <input type="text" placeholder="Cargo *" value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})} className="p-3 bg-gray-800 border border-gray-600 rounded-lg" />
                                <input type="text" placeholder="Gestor" value={newEmployee.manager} onChange={(e) => setNewEmployee({...newEmployee, manager: e.target.value})} className="p-3 bg-gray-800 border border-gray-600 rounded-lg" />
                            </div>
                            <div className="mb-4"><h3 className="text-lg font-semibold mb-2">Acessos de Software</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-4 bg-gray-800 rounded-lg max-h-60 overflow-y-auto">{softwareList.map(s => {const currentLevel = newEmployee.softwareAccess.find(sa => sa.softwareId === s.id)?.level || 'Nenhum'; return (<div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-gray-700"><label htmlFor={`level-${s.id}`} className="flex-1 text-gray-200">{s.name}</label><select id={`level-${s.id}`} value={currentLevel} onChange={(e) => handleAccessLevelChange(s.id, e.target.value)} className="p-2 bg-gray-900 border border-gray-600 rounded-lg text-sm">{ACCESS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></div>)})}</div></div>
                            <div className="flex gap-4"><button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">{editingEmployee ? 'Salvar Alterações' : 'Adicionar'}</button>{editingEmployee && <button type="button" onClick={resetEmployeeForm} className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition">Cancelar</button>}</div>
                        </form>
                        <div className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600"><h2 className="text-2xl font-bold text-gray-200 mb-4">Lista de Colaboradores</h2><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-600"><thead className="bg-gray-800"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Cargo</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Softwares</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ações</th></tr></thead><tbody className="bg-gray-700 divide-y divide-gray-600">{employees.map(emp => (<tr key={emp.id}><td className="px-6 py-4">{emp.name}</td><td className="px-6 py-4">{emp.role}</td><td className="px-6 py-4 text-sm text-gray-400">{emp.softwareAccess?.map(sa => getSoftwareName(sa.softwareId)).join(', ')}</td><td className="px-6 py-4 flex gap-2"><button onClick={() => startEditEmployee(emp)} className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700" title="Editar">✏️</button><button onClick={() => deleteEmployee(emp.id)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700" title="Excluir">🗑️</button></td></tr>))}</tbody></table></div></div>
                    </div>
                )}

                {activeTab === 'software' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <form onSubmit={handleSoftwareSubmit} className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600"><h2 className="text-2xl font-bold text-gray-200 mb-4">{editingSoftware ? 'Editar Software' : 'Adicionar Software'}</h2><div className="flex gap-4 mb-4"><input type="text" placeholder="Nome do Software *" value={newSoftwareName} onChange={(e) => setNewSoftwareName(e.target.value)} className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg" /></div><div className="flex gap-4"><button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">{editingSoftware ? 'Salvar' : 'Adicionar'}</button>{editingSoftware && <button type="button" onClick={resetSoftwareForm} className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition">Cancelar</button>}</div></form>
                        <div className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600"><h2 className="text-2xl font-bold text-gray-200 mb-4">Lista de Softwares</h2><div className="overflow-y-auto max-h-96"><table className="min-w-full divide-y divide-gray-600"><thead className="bg-gray-800 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ações</th></tr></thead><tbody className="bg-gray-700 divide-y divide-gray-600">{softwareList.map(s => (<tr key={s.id}><td className="px-6 py-4">{s.name}</td><td className="px-6 py-4 flex gap-2"><button onClick={() => startEditSoftware(s)} className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700" title="Editar">✏️</button><button onClick={() => deleteSoftware(s.id)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700" title="Excluir">🗑️</button></td></tr>))}</tbody></table></div></div>
                    </div>
                )}

                <div ref={confirmModalRef} className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 hidden"><div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-700"><h3 className="text-xl font-bold text-center text-gray-100 mb-4">Confirmação</h3><p className="text-center text-gray-300 mb-6">{confirmMessage}</p><div className="flex justify-center gap-4"><button onClick={hideConfirmModal} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancelar</button><button onClick={handleConfirm} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Confirmar</button></div></div></div>
            </div>
        </div>
    );
}
export default App;
