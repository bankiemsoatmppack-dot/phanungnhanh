import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { CHART_LINE_DATA, CHART_BAR_DATA } from '../constants';
import { FileText, Clock, AlertTriangle, Flag, ArrowRight, Grid, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard = ({ title, count, color, icon: Icon }: any) => (
  <div className={`p-4 rounded-lg text-white shadow-md relative overflow-hidden h-28 flex flex-col justify-between`} style={{ backgroundColor: color }}>
    <div className="flex justify-between items-start">
      <h3 className="text-sm font-medium opacity-90">{title}</h3>
      <Icon size={20} className="opacity-80" />
    </div>
    <div className="text-3xl font-bold">{count}</div>
    <div className="absolute -bottom-4 -right-4 opacity-20 transform rotate-12">
        <Icon size={80} />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-gray-700">
           <Grid size={20} />
           <span className="font-bold text-lg">Chỉ số</span>
        </div>
        <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600"><Calendar size={14} /> March, 2022</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Chưa xử lý" count={17} color="#3b82f6" icon={FileText} />
        <StatCard title="Chờ duyệt" count={0} color="#10b981" icon={Clock} />
        <StatCard title="Quá hạn" count={2} color="#f97316" icon={AlertTriangle} />
        <StatCard title="Khẩn" count={3} color="#ef4444" icon={Flag} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[400px]">
        {/* Line Chart */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Thống kê số lượng booking theo phòng (đơn vị: lần)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={CHART_LINE_DATA}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="value2" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="value3" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel/Bar Chart */}
        <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
           <h3 className="text-sm font-bold text-gray-700 mb-4">Top 10 các đơn vị có công văn gửi/nhận</h3>
           <div className="flex-1 flex flex-col justify-center">
             {CHART_BAR_DATA.map((item, index) => (
               <div key={index} className="flex items-center mb-2 last:mb-0 group cursor-pointer">
                 <div className="flex-1 flex justify-end">
                    <div 
                        className="h-8 flex items-center justify-end px-3 text-white text-xs font-medium transition-all duration-300 group-hover:opacity-90 rounded-l-sm"
                        style={{ width: `${item.value}%`, backgroundColor: COLORS[index % COLORS.length] }}
                    >
                        {item.name}
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Right Summary Text */}
        <div className="w-full lg:w-48 bg-transparent flex flex-row lg:flex-col justify-between gap-4">
             <div className="bg-white p-4 rounded-xl flex-1 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-blue-500 font-bold text-2xl flex items-center"><ArrowRight size={20} className="mr-1"/> 25</div>
                <div className="text-xs text-blue-500 font-medium">Công văn đến</div>
             </div>
             <div className="bg-white p-4 rounded-xl flex-1 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-green-500 font-bold text-2xl flex items-center"><ArrowRight size={20} className="mr-1"/> 16</div>
                <div className="text-xs text-green-500 font-medium">Công văn đi</div>
             </div>
             <div className="bg-white p-4 rounded-xl flex-1 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-orange-500 font-bold text-2xl flex items-center"><ArrowRight size={20} className="mr-1"/> 12</div>
                <div className="text-xs text-orange-500 font-medium">Công văn nội bộ</div>
             </div>
        </div>
      </div>

      {/* Donut Charts Footer */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
             <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="h-16 w-16 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={[{value: 53}, {value: 47}]} dataKey="value" innerRadius={20} outerRadius={30} paddingAngle={0}>
                                <Cell fill={COLORS[i % COLORS.length]} />
                                <Cell fill="#f3f4f6" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-[10px] font-bold text-gray-500">
                        <span>53</span>
                        <span>CV</span>
                    </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full`} style={{background: COLORS[i % COLORS.length]}}></div> Đã xử lý</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Chưa xử lý</div>
                </div>
             </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
