/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import * as todoService from './api/todos';
import { FilterOptions } from './types/FilterOptions';
import { Todolist } from './components/TodoList';
import { TodoItem } from './components/TodoItem';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterOptions>(
    FilterOptions.All,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingId, setDeletingID] = useState([0]);
  // const [selectedTodo, setSelectedTodo] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDelete = (todoId: number): Promise<void> => {
    setDeletingID(prev => [...prev, todoId]);

    return todoService
      .deleteTodos(todoId)
      .then(() => {
        setLoading(true);
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setLoading(false);
        setDeletingID((prev: number[]) => prev.filter(id => id !== todoId));
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  const filteredTodos = useMemo(() => {
    switch (currentFilter) {
      case FilterOptions.Active:
        return todos.filter(todo => !todo.completed);
      case FilterOptions.Completed:
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [currentFilter, todos]);

  const newTodo: Todo = {
    id: 0,
    title: newTodoTitle.trim(),
    userId: USER_ID,
    completed: false,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newTodoTitle.trim()) {
      setErrorMessage('Title should not be empty');
      inputRef.current?.focus();
      setTimeout(() => setErrorMessage(''), 3000);

      return;
    }

    setTempTodo(newTodo);

    try {
      const addNewTodo = await todoService.postTodo(newTodo);

      setTodos(prevTodos => [...prevTodos, addNewTodo]);
      setNewTodoTitle('');
      setErrorMessage('');
    } catch {
      setErrorMessage('Unable to add a todo');
    } finally {
      setTempTodo(null);
      inputRef.current?.focus();
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const allCompleted = todos.length > 0 && todos.every(todo => todo.completed);

  const activeTodos = todos.filter(todo => !todo.completed).length;

  const completedAllTodos = () => {
    const shouldCompleteAllTodos = !allCompleted;

    setTodos(
      todos.map(todo => ({ ...todo, completed: shouldCompleteAllTodos })),
    );
  };

  const toggleTodoCompletion = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [todos, inputRef]);

  function loadTodos() {
    setLoading(true);

    todoService
      .getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'))
      .finally(() => {
        setLoading(false);
        inputRef.current?.focus();
        setTimeout(() => setErrorMessage(''), 3000);
      });
  }

  useEffect(loadTodos, []);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleClearCompleted = () => {
    const completedTodoId = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    completedTodoId.forEach(todo => {
      handleDelete(todo);
    });
  };

  return (
    <>
      <div className="todoapp">
        <h1 className="todoapp__title">todos</h1>
        <div className="todoapp__content">
          <header className="todoapp__header">
            <button
              type="button"
              className={`todoapp__toggle-all ${allCompleted ? 'active' : ''}`}
              data-cy="ToggleAllButton"
              onClick={completedAllTodos}
            />

            <form onSubmit={handleSubmit}>
              <input
                value={newTodoTitle}
                ref={inputRef}
                onChange={e => setNewTodoTitle(e.target.value)}
                data-cy="NewTodoField"
                type="text"
                className={`todoapp__new-todo ${inputRef.current?.focus() ? 'focused' : ''}`}
                placeholder="What needs to be done?"
                disabled={tempTodo !== null}
                autoFocus
              />
            </form>
          </header>
        </div>
        <Todolist
          todos={filteredTodos}
          onToggleTodo={toggleTodoCompletion}
          onDelete={handleDelete}
          deletingId={deletingId}
          loading={loading}
        />
        {tempTodo && (
          <TodoItem
            todo={tempTodo}
            onToggleTodo={toggleTodoCompletion}
            onDelete={handleDelete}
            deletingId={deletingId}
            loading={loading}
          />
        )}
        {todos.length !== 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${activeTodos} items left`}
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${currentFilter === FilterOptions.All ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setCurrentFilter(FilterOptions.All)}
              >
                All
              </a>
              <a
                href="#/active"
                className={`filter__link ${currentFilter === FilterOptions.Active ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => setCurrentFilter(FilterOptions.Active)}
              >
                Active
              </a>
              <a
                href="#/completed"
                className={`filter__link ${currentFilter === FilterOptions.Completed ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => setCurrentFilter(FilterOptions.Completed)}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={() => handleClearCompleted()}
              disabled={todos.every(todo => !todo.completed) || loading}
            >
              Clear completed
            </button>
          </footer>
        )}
        <div
          data-cy="ErrorNotification"
          className={`notification is-danger is-light has-text-weight-normal ${errorMessage ? '' : 'hidden'}`}
        >
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => setErrorMessage('')}
          />
          {errorMessage}
        </div>
      </div>
    </>
  );
};
