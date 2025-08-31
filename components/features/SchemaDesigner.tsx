import React, { useState, useRef, useMemo, useCallback } from 'react';
import { MapIcon, ArrowDownTrayIcon, PlusIcon, TrashIcon, PencilIcon, LinkIcon } from '../icons.tsx';
import { downloadFile } from '../../services/fileUtils.ts';

// --- TYPES ---
type Constraint = 'PK' | 'NN' | 'UQ' | string; // string for FK like 'FK_table_column'
type SQLDataType = 'INTEGER' | 'VARCHAR(255)' | 'TEXT' | 'DATE' | 'TIMESTAMP' | 'DECIMAL(18, 2)' | 'BOOLEAN';

interface Column {
    id: number;
    name: string;
    type: SQLDataType;
    constraints: Constraint[];
}
interface Table {
    id: number;
    name: string;
    columns: Column[];
    x: number;
    y: number;
}
interface Relationship {
    fromTable: number;
    fromColumn: number;
    toTable: number;
    toColumn: number;
}

// --- TEMPLATES ---
const bankingTemplates: Record<string, { name: string; tables: Table[] }> = {
    'core-banking': {
        name: 'Core Banking',
        tables: [
            { id: 1, name: 'Customers', x: 50, y: 50, columns: [
                { id: 1, name: 'customer_id', type: 'INTEGER', constraints: ['PK', 'NN'] },
                { id: 2, name: 'first_name', type: 'VARCHAR(255)', constraints: ['NN'] },
                { id: 3, name: 'last_name', type: 'VARCHAR(255)', constraints: ['NN'] },
                { id: 4, name: 'address', type: 'TEXT', constraints: [] },
                { id: 5, name: 'email', type: 'VARCHAR(255)', constraints: ['UQ', 'NN'] },
                { id: 6, name: 'phone', type: 'VARCHAR(255)', constraints: [] },
                { id: 7, name: 'created_at', type: 'TIMESTAMP', constraints: ['NN'] }
            ]},
            { id: 2, name: 'Accounts', x: 400, y: 50, columns: [
                { id: 1, name: 'account_id', type: 'INTEGER', constraints: ['PK', 'NN'] },
                { id: 2, name: 'customer_id', type: 'INTEGER', constraints: ['FK_Customers_customer_id'] },
                { id: 3, name: 'account_type', type: 'VARCHAR(255)', constraints: ['NN'] },
                { id: 4, name: 'balance', type: 'DECIMAL(18, 2)', constraints: ['NN'] },
                { id: 5, name: 'currency', type: 'VARCHAR(255)', constraints: ['NN'] },
                { id: 6, name: 'opened_at', type: 'TIMESTAMP', constraints: ['NN'] },
                { id: 7, name: 'status', type: 'VARCHAR(255)', constraints: ['NN'] }
            ]},
            { id: 3, name: 'Transactions', x: 400, y: 350, columns: [
                { id: 1, name: 'transaction_id', type: 'INTEGER', constraints: ['PK', 'NN'] },
                { id: 2, name: 'account_id', type: 'INTEGER', constraints: ['FK_Accounts_account_id'] },
                { id: 3, name: 'transaction_type', type: 'VARCHAR(255)', constraints: ['NN'] },
                { id: 4, name: 'amount', type: 'DECIMAL(18, 2)', constraints: ['NN'] },
                { id: 5, name: 'currency', type: 'VARCHAR(255)', constraints: ['NN'] },
                { id: 6, name: 'transaction_date', type: 'TIMESTAMP', constraints: ['NN'] },
                { id: 7, name: 'description', type: 'TEXT', constraints: [] }
            ]}
        ]
    },
    'wealth-management': {
        name: 'Wealth Management',
        tables: [
            { id: 1, name: 'Clients', x: 50, y: 150, columns: [ { id: 1, name: 'client_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'client_name', type: 'VARCHAR(255)', constraints: ['NN'] } ]},
            { id: 2, name: 'Portfolios', x: 350, y: 50, columns: [ { id: 1, name: 'portfolio_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'client_id', type: 'INTEGER', constraints: ['FK_Clients_client_id'] }, { id: 3, name: 'name', type: 'VARCHAR(255)', constraints: ['NN'] } ]},
            { id: 3, name: 'Assets', x: 350, y: 250, columns: [ { id: 1, name: 'asset_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'ticker', type: 'VARCHAR(255)', constraints: ['NN'] } ]},
            { id: 4, name: 'Holdings', x: 650, y: 150, columns: [ { id: 1, name: 'holding_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'portfolio_id', type: 'INTEGER', constraints: ['FK_Portfolios_portfolio_id'] }, { id: 3, name: 'asset_id', type: 'INTEGER', constraints: ['FK_Assets_asset_id'] }, { id: 4, name: 'quantity', type: 'DECIMAL(18, 2)', constraints: ['NN'] } ]}
        ]
    },
    'lending': {
        name: 'Lending',
        tables: [
            { id: 1, name: 'Borrowers', x: 50, y: 200, columns: [ { id: 1, name: 'borrower_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'name', type: 'VARCHAR(255)', constraints: ['NN'] } ]},
            { id: 2, name: 'Loans', x: 350, y: 50, columns: [ { id: 1, name: 'loan_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'borrower_id', type: 'INTEGER', constraints: ['FK_Borrowers_borrower_id'] }, { id: 3, name: 'amount', type: 'DECIMAL(18, 2)', constraints: ['NN'] } ]},
            { id: 3, name: 'Collateral', x: 350, y: 250, columns: [ { id: 1, name: 'collateral_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'loan_id', type: 'INTEGER', constraints: ['FK_Loans_loan_id'] }, { id: 3, name: 'type', type: 'VARCHAR(255)', constraints: ['NN'] } ]},
            { id: 4, name: 'Repayments', x: 650, y: 150, columns: [ { id: 1, name: 'repayment_id', type: 'INTEGER', constraints: ['PK'] }, { id: 2, name: 'loan_id', type: 'INTEGER', constraints: ['FK_Loans_loan_id'] }, { id: 3, name: 'amount', type: 'DECIMAL(18, 2)', constraints: ['NN'] } ]}
        ]
    }
};

// --- HELPERS ---
const exportToSQL = (tables: Table[]) => {
    let sql = '';
    const foreignKeys: string[] = [];

    tables.forEach(table => {
        const columnsSQL = table.columns.map(col => {
            let line = `  "${col.name}" ${col.type}`;
            if (col.constraints.includes('PK')) line += ' PRIMARY KEY';
            if (col.constraints.includes('NN')) line += ' NOT NULL';
            if (col.constraints.includes('UQ')) line += ' UNIQUE';
            return line;
        }).join(',\n');
        
        const tableFks = table.columns.filter(c => c.constraints.some(cons => cons.startsWith('FK_')));
        tableFks.forEach(col => {
            const fkConstraint = col.constraints.find(c => c.startsWith('FK_'))!;
            const [, targetTable, targetCol] = fkConstraint.split('_');
            foreignKeys.push(`ALTER TABLE "${table.name}" ADD FOREIGN KEY ("${col.name}") REFERENCES "${targetTable}" ("${targetCol}");`);
        });

        sql += `CREATE TABLE "${table.name}" (\n${columnsSQL}\n);\n\n`;
    });
    
    sql += '-- Foreign Keys\n';
    sql += foreignKeys.join('\n');

    return sql;
};

// --- COMPONENTS ---
const TableComponent: React.FC<{ table: Table; onMouseDown: (e: React.MouseEvent, id: number) => void; isSelected: boolean; }> = ({ table, onMouseDown, isSelected }) => (
    <div
        className={`absolute w-64 bg-surface rounded-lg shadow-xl border-2 cursor-grab active:cursor-grabbing ${isSelected ? 'border-primary shadow-primary/20' : 'border-border'}`}
        style={{ top: table.y, left: table.x, transform: 'translateZ(0)' }}
        onMouseDown={e => onMouseDown(e, table.id)}
    >
        <h3 className="font-bold text-lg p-2 bg-gray-50 dark:bg-slate-700/50 rounded-t-lg border-b border-border text-center text-text-primary">{table.name}</h3>
        <div className="p-2 space-y-1 font-mono text-xs">
            {table.columns.map(col => (
                <div key={col.id} className="flex justify-between items-center p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                    <div>
                        <span className="text-text-primary font-semibold">{col.name}</span>
                        {col.constraints.includes('PK') && <span className="text-yellow-600 ml-1" title="Primary Key">PK</span>}
                        {col.constraints.some(c => c.startsWith('FK_')) && <span className="text-blue-500 ml-1" title="Foreign Key">FK</span>}
                    </div>
                    <span className="text-text-secondary">{col.type}</span>
                </div>
            ))}
        </div>
    </div>
);

export const SchemaDesigner: React.FC = () => {
    const [tables, setTables] = useState<Table[]>(bankingTemplates['core-banking'].tables);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const relationships = useMemo(() => {
        const rels: Relationship[] = [];
        const tableMap = new Map(tables.map(t => [t.name, t]));
        tables.forEach(table => {
            table.columns.forEach(col => {
                const fk = col.constraints.find(c => c.startsWith('FK_'));
                if (fk) {
                    const [, targetTableName, targetColName] = fk.split('_');
                    const targetTable = tableMap.get(targetTableName);
                    if (targetTable) {
                        const targetCol = targetTable.columns.find(c => c.name === targetColName);
                        if (targetCol) {
                            rels.push({ fromTable: table.id, fromColumn: col.id, toTable: targetTable.id, toColumn: targetCol.id });
                        }
                    }
                }
            });
        });
        return rels;
    }, [tables]);

    const onMouseDown = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setSelectedTableId(id);
        const tableElement = e.currentTarget as HTMLDivElement;
        const rect = tableElement.getBoundingClientRect();
        const canvasRect = canvasRef.current!.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging || !canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setTables(tables.map(t => t.id === dragging.id ? { ...t, x: e.clientX - dragging.offsetX - canvasRect.left, y: e.clientY - dragging.offsetY - canvasRect.top } : t));
    };

    const onMouseUp = () => setDragging(null);
    
    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);
    
    const handleLoadTemplate = (key: string) => {
        setTables(bankingTemplates[key].tables);
        setSelectedTableId(null);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6"><h1 className="text-3xl font-bold flex items-center"><MapIcon /><span className="ml-3">Interactive Schema Designer</span></h1><p className="text-text-secondary mt-1">Visually design your database schema, load banking templates, and export to SQL.</p></header>
            <div className="flex-grow flex gap-6 min-h-0">
                <main ref={canvasRef} className="flex-grow relative bg-background rounded-lg border-2 border-dashed border-border overflow-auto" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onClick={() => setSelectedTableId(null)}>
                     <svg className="absolute inset-0 w-full h-full pointer-events-none" width="100%" height="100%">
                        {relationships.map((rel, i) => {
                            const fromTable = tables.find(t => t.id === rel.fromTable);
                            const toTable = tables.find(t => t.id === rel.toTable);
                            if (!fromTable || !toTable) return null;
                            return <line key={i} x1={fromTable.x + 128} y1={fromTable.y + 20} x2={toTable.x + 128} y2={toTable.y + 20} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5,5" />;
                        })}
                    </svg>
                    {tables.map(table => (
                        <div key={table.id} onClick={e => {e.stopPropagation(); setSelectedTableId(table.id)}}>
                            <TableComponent table={table} onMouseDown={onMouseDown} isSelected={selectedTableId === table.id} />
                        </div>
                    ))}
                </main>
                <aside className="w-96 flex-shrink-0 flex flex-col gap-4">
                     <div className="bg-surface border border-border p-4 rounded-lg">
                        <label className="font-bold mb-2 block">Load Template</label>
                        <select onChange={(e) => handleLoadTemplate(e.target.value)} className="w-full p-2 bg-background border border-border rounded">
                            {Object.entries(bankingTemplates).map(([key, {name}]) => <option key={key} value={key}>{name}</option>)}
                        </select>
                    </div>
                    <div className="flex-grow bg-surface border border-border p-4 rounded-lg overflow-y-auto">
                        <h3 className="font-bold mb-2 text-lg">Editor</h3>
                        {selectedTable ? (
                            <div className="text-sm">Editing <span className="font-mono text-primary">{selectedTable.name}</span> coming soon...</div>
                        ) : (
                            <p className="text-xs text-text-secondary">Select a table to see details or add a new one.</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                         <button onClick={() => downloadFile(JSON.stringify(tables, null, 2), 'schema.json', 'application/json')} className="flex-1 text-sm py-2 bg-gray-100 dark:bg-slate-700 border border-border rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Download JSON
                        </button>
                         <button onClick={() => downloadFile(exportToSQL(tables), 'schema.sql', 'application/sql')} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Export to SQL
                         </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};
