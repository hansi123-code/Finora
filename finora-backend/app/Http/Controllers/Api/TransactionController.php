<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()
                ->transactions()
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:income,expense',
            'category' => 'required|string|max:255',
            'transaction_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $transaction = $request->user()
            ->transactions()
            ->create($validated);

        return response()->json([
            'message' => 'Transaction created successfully.',
            'transaction' => $transaction,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $transaction = $request->user()
            ->transactions()
            ->findOrFail($id);

        return response()->json($transaction);
    }

    public function update(Request $request, string $id)
    {
        $transaction = $request->user()
            ->transactions()
            ->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'type' => 'sometimes|required|in:income,expense',
            'category' => 'sometimes|required|string|max:255',
            'transaction_date' => 'sometimes|required|date',
            'description' => 'sometimes|nullable|string',
        ]);

        $transaction->update($validated);

        return response()->json([
            'message' => 'Transaction updated successfully.',
            'transaction' => $transaction,
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $transaction = $request->user()
            ->transactions()
            ->findOrFail($id);

        $transaction->delete();

        return response()->json([
            'message' => 'Transaction deleted successfully.',
        ]);
    }
}
