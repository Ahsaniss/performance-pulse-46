import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Task } from '../../types';

interface TaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export const TaskListModal: React.FC<TaskListModalProps> = ({
  isOpen,
  onClose,
  title,
  tasks,
  onTaskClick,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No tasks found</TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    onTaskClick(task.id);
                    // We don't close this modal automatically, allowing user to go back to list?
                    // Or we can close it. Let's keep it open so they can browse.
                    // But the GraphDetailModal will open on top.
                  }}
                >
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in-progress' ? 'secondary' : 'outline'}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{task.difficulty || 'Medium'}</TableCell>
                  <TableCell>
                    {task.deadline ? format(parseISO(task.deadline), 'MMM d, yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};
