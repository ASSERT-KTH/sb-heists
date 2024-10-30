from dataclasses import dataclass
from typing import List

@dataclass
class TestResult:
    contract: str
    patch_path: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    sanity_success: int
    sanity_failures: int
    failed_sanity_results: List[str]
    failed_results: List[str]
    passed_results: List[str]

    def get_contract(self) -> str:
        return self.contract

    def get_patch_path(self) -> str:
        return self.patch_path
    
    def get_total_tests(self) -> int:
        return self.total_tests
    
    def get_passed_tests(self) -> int:
        return self.passed_tests
    
    def get_failed_tests(self) -> int:
        return self.failed_tests
    
    def get_sanity_failures(self) -> List[str]:
        return self.failures_sanity
    
    def get_failed_results(self) -> List[str]:
        return self.failed_results
    
    def get_passed_results(self) -> List[str]:
        return self.passed_results
    
    def fully_repaired(self) -> bool:
        return self.sanity_failures == 0 and self.passed_tests - self.sanity_success == 0
