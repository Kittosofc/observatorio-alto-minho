"""Testes simples. Correr na pasta scripts/:  python -m unittest discover tests -v"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openpyxl import Workbook

from update_data.config import TERRITORIES
from update_data.pordata import choose_pordata_values
from update_data.values import as_number, merge_history, validate_values


def all_territories(value):
    return {name: value for name in TERRITORIES}


def make_excel(path, columns):
    """Cria um Excel no formato da Pordata. `columns` = [(ano, {território: valor}), ...]."""
    wb = Workbook()
    ws = wb.active
    ws.append(["Âmbito geográfico", "Anos"] + [year for year, _ in columns])
    for name in TERRITORIES:
        ws.append([None, name] + [values.get(name) for _, values in columns])
    wb.save(path)


class AsNumberTest(unittest.TestCase):
    def test_numbers(self):
        self.assertEqual(as_number(5), 5)
        self.assertEqual(as_number(5.0), 5)
        self.assertEqual(as_number(5.5), 5.5)

    def test_portuguese_text(self):
        self.assertEqual(as_number("1.234,5"), 1234.5)
        self.assertEqual(as_number("12 %"), 12)
        self.assertEqual(as_number("3,14"), 3.14)

    def test_empty_values(self):
        for value in (None, "", "-", "..", ":", "abc", True, float("nan")):
            self.assertIsNone(as_number(value), value)


class ValidateValuesTest(unittest.TestCase):
    def test_valid(self):
        validate_values(all_territories(1), "x")

    def test_missing_territory(self):
        values = all_territories(1)
        del values[TERRITORIES[0]]
        with self.assertRaisesRegex(ValueError, "faltam territórios"):
            validate_values(values, "x")

    def test_non_numeric_territory(self):
        values = all_territories(1)
        values[TERRITORIES[0]] = ".."
        with self.assertRaises(ValueError):
            validate_values(values, "x")

    def test_all_zero(self):
        with self.assertRaisesRegex(ValueError, "zero"):
            validate_values(all_territories(0), "x")


class MergeHistoryTest(unittest.TestCase):
    def test_new_years_replace_and_old_are_kept(self):
        entry = {"history": {"2020": {"a": 1}, "2021": {"a": 2}}}
        merge_history(entry, {"2021": {"a": 9}, "2022": {"a": 3}})
        self.assertEqual(entry["history"], {"2020": {"a": 1}, "2021": {"a": 9}, "2022": {"a": 3}})


class ChoosePordataValuesTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.path = Path(self.dir.name) / "x.xlsx"

    def tearDown(self):
        self.dir.cleanup()

    def test_picks_latest_year_closest_to_current(self):
        # 2023 tem duas colunas (ex.: homens/mulheres); a atual (100) corresponde à primeira.
        make_excel(self.path, [
            (2022, all_territories(95)),
            (2023, all_territories(102)),
            (2023, all_territories(7)),
        ])
        year, values, score, columns = choose_pordata_values(self.path, all_territories(100), 2022)
        self.assertEqual(year, "2023")
        self.assertEqual(values, all_territories(102))
        self.assertEqual(columns, (3,))
        self.assertLess(score, 0.1)

    def test_sums_columns_when_closer(self):
        make_excel(self.path, [(2023, all_territories(60)), (2023, all_territories(40))])
        _, values, _, columns = choose_pordata_values(self.path, all_territories(100), 2022)
        self.assertEqual(values, all_territories(100))
        self.assertEqual(columns, (2, 3))

    def test_rejects_year_older_than_current(self):
        make_excel(self.path, [(2020, all_territories(100))])
        with self.assertRaisesRegex(ValueError, "anterior"):
            choose_pordata_values(self.path, all_territories(100), 2022)

    def test_rejects_series_too_different(self):
        make_excel(self.path, [(2023, all_territories(1000))])
        with self.assertRaisesRegex(ValueError, "suficientemente próxima"):
            choose_pordata_values(self.path, all_territories(10), 2022)

    def test_rejects_incomplete_territories(self):
        values = all_territories(100)
        del values[TERRITORIES[1]]
        make_excel(self.path, [(2023, values)])
        with self.assertRaisesRegex(ValueError, "completas"):
            choose_pordata_values(self.path, all_territories(100), 2022)


if __name__ == "__main__":
    unittest.main()