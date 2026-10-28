<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingsGoal;
use Illuminate\Http\Request;

class SavingsGoalController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->savingsGoals()->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0.01',
            'saved_amount' => 'sometimes|numeric|min:0',
            'target_date' => 'nullable|date',
        ]);

        $goal = $request->user()
            ->savingsGoals()
            ->create($validated);

        return response()->json([
            'message' => 'Savings goal created successfully.',
            'goal' => $goal,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $goal = $request->user()
            ->savingsGoals()
            ->findOrFail($id);

        return response()->json($goal);
    }

    public function update(Request $request, string $id)
    {
        $goal = $request->user()
            ->savingsGoals()
            ->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'target_amount' => 'sometimes|required|numeric|min:0.01',
            'saved_amount' => 'sometimes|required|numeric|min:0',
            'target_date' => 'sometimes|nullable|date',
        ]);

        $goal->update($validated);

        return response()->json([
            'message' => 'Savings goal updated successfully.',
            'goal' => $goal,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $goal = $request->user()
            ->savingsGoals()
            ->findOrFail($id);

        $goal->delete();

        return response()->json([
            'message' => 'Savings goal deleted successfully.',
        ]);
    }
}
