import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';

export const MetricDetailsPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [type]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await userService.getMetricDetails(type || 'overview');
      setData(Array.isArray(res) ? res : [res]);
    } catch (err) {
      console.error('Failed to load metric drill-down:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    { header: 'ID', accessor: 'Id' },
    { header: 'Name / Title', accessor: (item) => item.Name || item.User_Name || item.Course_Name || item.Batch_Name || 'N/A' },
    { header: 'Status / Detail', accessor: (item) => item.Status || item.Email || item.Course_Category_Name || 'Active' },
    { header: 'Date', accessor: (item) => item.Created_Date || item.Date || item.Updated_Date || 'Recent' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 capitalize">
            {type?.replace('_', ' ')} Details
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Granular records for this metric</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage={`No details found for ${type}`}
      />
    </div>
  );
};
