import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { Plus, LogOut, Trash2, CheckCircle, Circle } from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const token = Cookies.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000); // Real-time polling every 5 seconds
    return () => clearInterval(interval);
  }, [token, activeWorkspace]);

  const fetchData = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [tasksRes, workspacesRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/tasks${activeWorkspace ? `?workspaceId=${activeWorkspace}` : ''}`,
          config
        ),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, config)
      ]);

      setTasks(tasksRes.data);
      setWorkspaces(workspacesRes.data);
      
      if (!activeWorkspace && workspacesRes.data.length > 0) {
        setActiveWorkspace(workspacesRes.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        Cookies.remove('token');
        router.push('/login');
      } else {
        setError('Failed to load data');
      }
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks`,
        {
          title: newTask,
          workspaceId: activeWorkspace
        },
        config
      );

      setNewTask('');
      fetchData();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleToggleTask = async (taskId, completed) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`,
        { completed: !completed },
        config
      );

      fetchData();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`,
        config
      );

      fetchData();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspaces */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspaces</h2>
          <div className="flex gap-3 flex-wrap">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeWorkspace === ws.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {ws.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tasks</h2>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={20} />
                Add Task
              </button>
            </form>

            {/* Task List */}
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks yet. Create one to get started!</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle size={24} className="text-green-500" />
                      ) : (
                        <Circle size={24} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-lg ${
                        task.completed
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
