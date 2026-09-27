import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { callService } from '../../services/callService';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';

export const CallLogsPage: React.FC = () => {
  const { user } = useStaffAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [ongoing, setOngoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const userId = user?.User_ID || user?.Id;
      const [historyRes, ongoingRes] = await Promise.all([
        callService.getCallHistory(userId || 0),
        callService.getOngoingCalls(),
      ]);
      setLogs(Array.isArray(historyRes) ? historyRes : []);
      setOngoing(Array.isArray(ongoingRes) ? ongoingRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Student Caller',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <PhoneIncoming className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{item.Student_Name || item.User_Name || 'Student Caller'}</p>
            <p className="text-xs text-slate-400">1-on-1 Consultation</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Call Duration',
      accessor: (item) => (
        <div className="flex items-center text-xs text-slate-600 space-x-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.Duration || item.Call_Duration || '05:32'}</span>
        </div>
      ),
    },
    {
      header: 'Timestamp',
      accessor: (item) => <span className="text-xs text-slate-600">{item.Created_Date || item.Date || 'Today'}</span>,
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge variant={item.Status === 1 || item.Status === 'Completed' ? 'success' : 'neutral'}>
          {item.Status || 'Completed'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Student Call & Consultation Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Audit voice consultations and student mentorship calls</p>
      </div>

      <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No call logs recorded yet." />
    </div>
  );
};
