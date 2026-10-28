<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->budgets()->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'spent' => 'sometimes|numeric|min:0',
            'period' => 'sometimes|in:weekly,monthly,yearly',
        ]);

        $budget = $request->user()->budgets()->create($validated);

        return response()->json([
            'message' => 'Budget created successfully.',
            'budget' => $budget,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $budget = $request->user()->budgets()->findOrFail($id);

        return response()->json($budget);
    }

    public function update(Request $request, string $id)
    {
        $budget = $request->user()->budgets()->findOrFail($id);

        $validated = $request->validate([
            'category' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'spent' => 'sometimes|required|numeric|min:0',
            'period' => 'sometimes|required|in:weekly,monthly,yearly',
        ]);

        $budget->update($validated);

        return response()->json([
            'message' => 'Budget updated successfully.',
            'budget' => $budget,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $budget = $request->user()->budgets()->findOrFail($id);

        $budget->delete();

        return response()->json([
            'message' => 'Budget deleted successfully.',
        ]);
    }
}
